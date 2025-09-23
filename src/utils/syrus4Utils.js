import { conversionToGpm, formatTime, conversionToVoltage, getTimeInSeconds } from "./plantUtils";
import { OPERATION_CODES, SYRUS_FOUR_COMMANDS, MAX_VALUE_OPERATIONS } from './constants'

/**
 * Busca la instancia de la aplicación 'ecoplant' en una lista y devuelve una cadena
 * formateada con su nombre y versión.
 * @param {Array<object>} listInstances - La lista de instancias de aplicaciones del dispositivo.
 * @returns {string} Una cadena con el nombre y la versión, o un mensaje de error si no se encuentra.
 */
export function titleCase(str) {
    var splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        // You do not need to check if i is larger than splitStr length, as your for does that for you
        // Assign it back to the array
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    // Directly return the joined string
    return splitStr.join(' ');
}

export function formatEcoplantVersion(listInstances) {
    if (listInstances === null || listInstances === undefined) return "Información no disponible";
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
        alerta: adcWarningValue ? conversionToGpm(adcWarningValue, mvZeroValue) : '',
        alarma: adcAlarmValue ? conversionToGpm(adcAlarmValue, mvZeroValue) : '',
    };
}

export function getValueParam(key, responseString) {
    // Busca la clave seguida de espacios y captura el número que le sigue.
    const regex = new RegExp(`${key}\\s+([\\d.]+)`);
    const match = responseString.match(regex);
    return match ? match[1] : null;
}

const OPERATION_CONFIG = {
    [OPERATION_CODES.FILTRATION]: { operation: "fil_time", isAlert: false, maxValue: [MAX_VALUE_OPERATIONS.FILTRATION] },
    [OPERATION_CODES.BACKWASH]: { operation: "invw_time", isAlert: false, maxValue: [MAX_VALUE_OPERATIONS.BACKWASH] },
    [OPERATION_CODES.RINSE]: { operation: "rinse_time", isAlert: false, maxValue: [MAX_VALUE_OPERATIONS.RINSE] },
    [OPERATION_CODES.FLOW_ALERT]: { operation: "adc_fil_warning_thr", isAlert: true, maxValue: [MAX_VALUE_OPERATIONS.FLOW_ALERT] },
    [OPERATION_CODES.INSUFFICIENT_FLOW_ALARM]: { operation: "adc_fil_alarm_thr", isAlert: true, maxValue: [MAX_VALUE_OPERATIONS.INSUFFICIENT_FLOW_ALARM] },
};
export function getSetterCommandSyrus4(codeOperation, timeValue, timeUnit, mvZeroValue) {
    const config = OPERATION_CONFIG[codeOperation];
    const typeOperation = config.operation;
    let convertedValue;
    if (config.isAlert) {
        convertedValue = conversionToVoltage(timeValue, mvZeroValue);
    } else {
        convertedValue = getTimeInSeconds(timeUnit, timeValue);
    }
    if (convertedValue > config.maxValue) return "";
    const command = `${SYRUS_FOUR_COMMANDS.SET_ECOPLANT_PARAM} "{"${typeOperation}":${convertedValue}}"`;
    return command;
}