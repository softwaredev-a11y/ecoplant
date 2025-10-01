import { convertVoltageToGpm, formatTime, convertGpmToVoltage, getTimeInSeconds } from "./syrusUtils";
import { OPERATION_CODES, SYRUS_FOUR_COMMANDS, MAX_VALUE_OPERATIONS, SYRUS4_SET_PARAMETER_KEYS, ERROR_MESSAGES } from './constants'

/**
 * Convierte en mayúscula la primera letra, y aquellas que estén después de un espacio de una oración.
 * @param {string} str - Oración a convertir.
 * @returns {string} - Palabra formateada.
 */
export function titleCase(str) {
    var splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    return splitStr.join(' ');
}

/**
 * Busca la instancia de la aplicación 'ecoplant' en una lista y devuelve una cadena
 * formateada con su nombre y versión.
 * @param {Array<object>} listInstances - La lista de instancias de aplicaciones del dispositivo.
 * @returns {string} Una cadena con el nombre y la versión, o un mensaje de error si no se encuentra.
 */
export function formatEcoplantVersion(listInstances) {
    if (listInstances === null || listInstances === undefined) return ERROR_MESSAGES.INFORMATION_NOT_AVAILABLE;
    const ecoplantInstance = listInstances.find(instance =>
        instance && typeof instance.app_name === 'string' && instance.app_name.includes('ecoplant')
    );
    if (!ecoplantInstance) {
        return 'Versión de Ecoplant no encontrada';
    }
    const response = titleCase(`${ecoplantInstance.app_name} ${ecoplantInstance.version}`.replaceAll("_", " "));

    return `${response} 4G`;
}

/**
 * Extrae los parámetros de operación de la respuesta de un dispositivo Syrus 4.
 * La respuesta es un string con pares clave-valor.
 * @param {string} response - El string de respuesta del comando.
 * @returns {{filtracion: string, retrolavado: string, enjuague: string}}
 */
export function getEcoplantParams(response, mvZeroValue) {
    const filtrationValue = getValueParam('FILTRATION_TIME', response);
    const invWashingValue = getValueParam('INV_WASHING_TIME', response);
    const rinseValue = getValueParam('RINSE_TIME', response);
    const adcWarningValue = getValueParam('ADC_WARNING_THRESHOLD', response);
    const adcAlarmValue = getValueParam('ADC_ALARM_THRESHOLD', response);

    return {
        filtracion: filtrationValue ? formatTime('segundos', parseInt(filtrationValue, 10)) : '',
        retrolavado: invWashingValue ? formatTime('segundos', parseInt(invWashingValue, 10)) : '',
        enjuague: rinseValue ? formatTime('segundos', parseInt(rinseValue, 10)) : '',
        alerta: adcWarningValue ? convertVoltageToGpm(adcWarningValue, mvZeroValue) : '',
        alarma: adcAlarmValue ? convertVoltageToGpm(adcAlarmValue, mvZeroValue) : '',
    };
}

export function getValueParam(key, responseString) {
    // Busca la clave seguida de espacios y captura el número que le sigue.
    if (responseString === null || responseString === undefined) return '';
    const regex = new RegExp(`${key}\\s+([\\d.]+)`);
    const match = responseString.match(regex);
    return match ? match[1] : null;
}

const OPERATION_CONFIG = {
    [OPERATION_CODES.FILTRATION]: { operation: [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_FIL], isAlert: false, maxValue: [MAX_VALUE_OPERATIONS.FILTRATION] },
    [OPERATION_CODES.INVW_TIME]: { operation: [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_B], isAlert: false, maxValue: [MAX_VALUE_OPERATIONS.INVW_TIME] },
    [OPERATION_CODES.RINSE]: { operation: [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_R], isAlert: false, maxValue: [MAX_VALUE_OPERATIONS.RINSE] },
    [OPERATION_CODES.FLOW_ALERT]: { operation: [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_F_ALERT], isAlert: true, maxValue: [MAX_VALUE_OPERATIONS.FLOW_ALERT] },
    [OPERATION_CODES.INSUFFICIENT_FLOW_ALARM]: { operation: [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_F_ALARM], isAlert: true, maxValue: [MAX_VALUE_OPERATIONS.INSUFFICIENT_FLOW_ALARM] },
};
export function buildSetterCommandSyrus4(codeOperation, timeValue, timeUnit, mvZeroValue) {
    const config = OPERATION_CONFIG[codeOperation];
    const typeOperation = config.operation;
    let convertedValue;
    if (config.isAlert) {
        convertedValue = convertGpmToVoltage(timeValue, mvZeroValue);
    } else {
        convertedValue = getTimeInSeconds(timeUnit, timeValue);
    }
    if (convertedValue > config.maxValue) return "";
    const command = `${SYRUS_FOUR_COMMANDS.SET_ECOPLANT_PARAM} "{"${typeOperation}":${convertedValue}}"`;
    return command;
}

export function proccessSyrus4SocketMessage(message, mvZeroValue) {
    if (!message) return null;
    message = message.replace(/\\/g, '');
    message = message.replace(/\s+/g, ' ');
    const operationHandlers = {
        [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_FIL]: { key: 'filtrado', calculate: getFiltrationValueFromMessage },
        [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_B]: { key: 'retrolavado', calculate: getInvWTimeValueFromMessage },
        [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_R]: { key: 'enjuague', calculate: getRinseValueFromMessage },
        [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_F_ALERT]: { key: 'valorAlertaFlujo', calculate: getFlowAlertValueFromMessage },
        [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_F_ALARM]: { key: 'valorAlarmaInsuficiente', calculate: getInsufficientAlarmValueFromMessage },
    };
    for (const opKey in operationHandlers) {
        if (message.includes(opKey)) {
            const handler = operationHandlers[opKey];
            const value = handler.calculate(message, mvZeroValue);
            if (value !== null) {
                return { key: handler.key, value };
            }
        }
    }
    return null;
}

export function getFiltrationValueFromMessage(message) {
    return formatTime('segundos', _extractValueByCode(message, SYRUS4_SET_PARAMETER_KEYS.CMD_SET_FIL, parseInt));
}

export function getInvWTimeValueFromMessage(message) {
    return formatTime('segundos', _extractValueByCode(message, SYRUS4_SET_PARAMETER_KEYS.CMD_SET_B, parseInt));
}

export function getRinseValueFromMessage(message) {
    return formatTime('segundos', _extractValueByCode(message, SYRUS4_SET_PARAMETER_KEYS.CMD_SET_R, parseInt));
}

export function getFlowAlertValueFromMessage(message, mvZeroValue) {
    return convertVoltageToGpm(_extractValueByCode(message, SYRUS4_SET_PARAMETER_KEYS.CMD_SET_F_ALERT, parseInt), mvZeroValue);
}

export function getInsufficientAlarmValueFromMessage(message, mvZeroValue) {
    return convertVoltageToGpm(_extractValueByCode(message, SYRUS4_SET_PARAMETER_KEYS.CMD_SET_F_ALARM, parseInt), mvZeroValue);
}

function _extractValueByCode(message, code, parser) {
    if (!message) return null;

    const regex = new RegExp(`["']?${code}["']?:\\s*(\\d+)`);
    const match = message.match(regex);

    if (!match) {
        console.warn(`No se encontró ${code} en el mensaje:`, message);
        return null;
    }

    return parser(match[1], 10);
}