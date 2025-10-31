import { convertVoltageToGpm, convertGpmToVoltage, } from "./syrus";
import { getTime, getFormattedTime } from "./time";
import { OPERATION_CODES, SYRUS_FOUR_COMMANDS, MAX_VALUE_OPERATIONS, SYRUS4_SET_PARAMETER_KEYS, UI_MESSAGES } from '@/constants/constants'
import { formatOperationHours, getSyrus4OperationHours } from "./operationHours";

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
    if (listInstances === null || listInstances === undefined) return UI_MESSAGES.INFORMATION_NOT_AVAILABLE;
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
    const startTime = getValueParam('START_HOURS', response);
    const endTime = getValueParam('END_HOURS', response);

    return {
        filtracion: filtrationValue ? getFormattedTime('segundos', parseInt(filtrationValue, 10)) : '',
        retrolavado: invWashingValue ? getFormattedTime('segundos', parseInt(invWashingValue, 10)) : '',
        enjuague: rinseValue ? getFormattedTime('segundos', parseInt(rinseValue, 10)) : '',
        alerta: adcWarningValue ? convertVoltageToGpm(adcWarningValue, mvZeroValue) : '',
        alarma: adcAlarmValue ? convertVoltageToGpm(adcAlarmValue, mvZeroValue) : '',
        horario: startTime && endTime ? formatOperationHours(startTime, endTime) : '',
    };
}

/**
 * Extrae el valor de un parámetro específico de una cadena de respuesta.
 * @param {string} key - La clave del parámetro a buscar (ej. 'FILTRATION_TIME').
 * @param {string} responseString - La cadena de respuesta completa del dispositivo.
 * @returns {string|null} El valor numérico del parámetro como una cadena, o `null` si no se encuentra.
 */
export function getValueParam(key, responseString) {
    // Busca la clave seguida de espacios y captura el número que le sigue.
    if (responseString === null || responseString === undefined) return '';
    const regex = new RegExp(`${key}\\s*([\\d.]+)`);
    const match = responseString.match(regex);
    return match ? match[1] : null;
}

const OPERATION_CONFIG = {
    [OPERATION_CODES.FILTRATION]: { operation: [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_FIL], isAlert: false, maxValue: MAX_VALUE_OPERATIONS.FILTRATION },
    [OPERATION_CODES.INVW_TIME]: { operation: [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_B], isAlert: false, maxValue: MAX_VALUE_OPERATIONS.INVW_TIME },
    [OPERATION_CODES.RINSE]: { operation: [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_R], isAlert: false, maxValue: MAX_VALUE_OPERATIONS.RINSE },
    [OPERATION_CODES.FLOW_ALERT]: { operation: [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_F_ALERT], isAlert: true, maxValue: MAX_VALUE_OPERATIONS.FLOW_ALERT },
    [OPERATION_CODES.INSUFFICIENT_FLOW_ALARM]: { operation: [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_F_ALARM], isAlert: true, maxValue: MAX_VALUE_OPERATIONS.INSUFFICIENT_FLOW_ALARM },
};
/**
 * Construye el comando para establecer un parámetro de operación en un dispositivo Syrus 4.
 * @param {string} codeOperation - El código de la operación a modificar.
 * @param {number} timeValue - El nuevo valor para el parámetro.
 * @param {string} timeUnit - La unidad del valor ('segundos', 'minutos', 'horas', o 'gpm' para alertas).
 * @param {string|number} mvZeroValue - El valor de 'mv_zero' necesario para conversiones de GPM a voltaje.
 * @returns {string} El comando formateado para enviar al dispositivo, o una cadena vacía si el valor excede el máximo permitido.
 * @throws {Error} Si el código de operación no es válido.
 */
export function buildSetterCommandSyrus4(codeOperation, timeValue, timeUnit, mvZeroValue) {
    const config = OPERATION_CONFIG[codeOperation];
    const typeOperation = config.operation;
    let convertedValue;
    if (config.isAlert) {
        convertedValue = convertGpmToVoltage(timeValue, mvZeroValue);
    } else {
        convertedValue = getTime(timeUnit, timeValue);
    }
    if (convertedValue > config.maxValue) return "";
    const command = `${SYRUS_FOUR_COMMANDS.SET_ECOPLANT_PARAM} "{"${typeOperation}":${convertedValue}}"`;
    return command;
}

/**
 * Procesa un mensaje de socket de un Syrus 4 para extraer un parámetro de operación actualizado.
 * @param {string} message - El mensaje recibido del socket.
 * @param {string|number} mvZeroValue - El valor de 'mv_zero' para cálculos de GPM.
 * @returns {{key: string, value: any}|null} Un objeto con la clave del parámetro y su nuevo valor.
 */
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
        [SYRUS4_SET_PARAMETER_KEYS.CMD_SET_START_TIME]: { key: 'horario', calculate: getSyrus4OperationHours },
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

/**
 * Extrae y formatea el valor de tiempo de filtración de un mensaje transformado de socket de Syrus 4.
 * @param {string} message - El mensaje del socket.
 * @returns {string|null} El tiempo de filtración formateado (ej. "10 minutos y 30 segundos") o `null`.
 */
export function getFiltrationValueFromMessage(message) {
    return getFormattedTime('segundos', _extractValueByCode(message, SYRUS4_SET_PARAMETER_KEYS.CMD_SET_FIL, parseInt));
}

/**
 * Extrae y formatea el valor de tiempo de retrolavado de un mensaje de socket de Syrus 4.
 * @param {string} message - El mensaje del socket.
 * @returns {string|null} El tiempo de retrolavado formateado o `null`.
 */
export function getInvWTimeValueFromMessage(message) {
    return getFormattedTime('segundos', _extractValueByCode(message, SYRUS4_SET_PARAMETER_KEYS.CMD_SET_B, parseInt));
}

/**
 * Extrae y formatea el valor de tiempo de enjuague de un mensaje de socket de Syrus 4.
 * @param {string} message - El mensaje del socket.
 * @returns {string|null} El tiempo de enjuague formateado o `null`.
 */
export function getRinseValueFromMessage(message) {
    return getFormattedTime('segundos', _extractValueByCode(message, SYRUS4_SET_PARAMETER_KEYS.CMD_SET_R, parseInt));
}

/**
 * Extrae y convierte el valor de alerta de flujo de un mensaje de socket de Syrus 4.
 * @param {string} message - El mensaje del socket.
 * @param {string|number} mvZeroValue - El valor de 'mv_zero' para la conversión de voltaje a GPM.
 * @returns {number|null} El valor de la alerta en GPM o `null`.
 */
export function getFlowAlertValueFromMessage(message, mvZeroValue) {
    return convertVoltageToGpm(_extractValueByCode(message, SYRUS4_SET_PARAMETER_KEYS.CMD_SET_F_ALERT, parseInt), mvZeroValue);
}

/**
 * Extrae y convierte el valor de alarma por flujo insuficiente de un mensaje de socket de Syrus 4.
 * @param {string} message - El mensaje del socket.
 * @param {string|number} mvZeroValue - El valor de 'mv_zero' para la conversión de voltaje a GPM.
 * @returns {number|null} El valor de la alarma en GPM o `null`.
 */
export function getInsufficientAlarmValueFromMessage(message, mvZeroValue) {
    return convertVoltageToGpm(_extractValueByCode(message, SYRUS4_SET_PARAMETER_KEYS.CMD_SET_F_ALARM, parseInt), mvZeroValue);
}

/**
 * Extrae un valor numérico de un mensaje de Syrus 4 basado en una clave.
 * @private
 * @param {string} message - El mensaje a parsear.
 * @param {string} code - La clave que precede al valor (ej. "fil_time").
 * @param {function} parser - La función para parsear el valor (parseInt o parseFloat).
 * @returns {number|null} El valor parseado o `null` si no se encuentra.
 */
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