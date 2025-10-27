import { SYRUS3_MESSAGE_HEADERS, MAX_VALUE_OPERATIONS, OPERATION_CODES, HEADER_MESSAGES_SOCKET, UI_MESSAGES, SESSION_STORAGE_KEYS_TO_USE } from "@/constants/constants";
import { getFormattedTime, getTime } from "./time";
import { fillLeftText, replaceAt } from "./string";

/**
 * Obtiene el modelo de la planta.
 * @param {String} text Cadena de texto que viene de consultar la api.
 * @returns {String} Modelo de la planta
 */
export function getPlantModel(text) {
    if (!text) return UI_MESSAGES.INFORMATION_NOT_AVAILABLE;
    const match = text.match(/\*type:Ecoplant\s*(\d+)/i);
    if (match) {
        return `${parseInt(match[1], 10)}`;
    }
    return 'Sin información disponible';
}

/**
 * Busca una planta dentro de una lista
 * @param {[]} plants Lista de plantas
 * @param {int} idPlant ID de la planta a buscar
 * @returns {object} Planta buscada
 */
export function searchPlant(plants, idPlant) {
    const plant = plants.find(p => String(p.id) === String(idPlant));
    return plant;
}
/**
 * Obtiene el mvZeroValue de una cadena de texto.
 * @param {String} descripcion Descripción del dispositivo que viene de la consulta de la api.
 * @returns {String} valor de mv zero.
 */
export function getMvZeroText(descripcion) {
    if (!descripcion) return UI_MESSAGES.INFORMATION_NOT_AVAILABLE;
    const match = descripcion.match(/mv_zero:(.*?)\nEND_PARAMS/s);
    return match ? match[1] : null;
}

/**
 * Obtiene la versión de software a partir de la configuración del dispositivo. Solamente funciona para dispositivos anteriores a syrus4.
 * @param {String} configuration Configuración del dispositivo.
 * @returns {String} Versión del software.
 */
export function getSoftwareVersion(configuration) {
    const mapConfigurations = { "p458": "1.2", "q111": "1.3", "q149": "1.4", "q537": "2.0", "r058": "3.0 1Horario", "r347": "1.0 AguaFria" };
    return mapConfigurations[configuration] || "0.0";
}

/**
 * Extrae un valor numérico de un mensaje basado en un código.
 * @private
 * @param {string} message El mensaje a parsear.
 * @param {string} code El código que precede al valor.
 * @param {function} parser La función para parsear el valor (parseInt o parseFloat).
 * @returns {number|null} El valor parseado o null si no se encuentra.
 */
function _extractValueByCode(message, code, parser) {
    if (!message) return null;
    const match = message.match(new RegExp(`${code}(\\d+);`));
    if (!match) return null;
    return parser(match[1], 10);
}

/**
 * Calcula el valor de la filtración a partir del mensaje que viene de la consula a la api o socket.
 * @param {String} message Mensaje que viene de una consulta a una api o del servidor.
 * @returns {number|null} Valor de la filtración.
 */
export function getFiltrationValueFromMessage(message) {
    return _extractValueByCode(message, SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_FIL, parseInt);
}

/**
 * Calcula el valor del retrolavado a partir del mensaje que viene de la consula a la api o socket.
 * @param {String} message Mensaje que viene de una consulta a una api o del servidor.
 * @returns {number|null} Valor del retrolavado.
 */
export function getInvWTimeValueFromMessage(message) {
    return _extractValueByCode(message, SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_B, parseInt);
}

/**
 * Calcula el valor del enjuague a partir del mensaje que viene de la consula a la api o socket.
 * @param {String} message Mensaje que viene de una consulta a una api o del servidor.
 * @returns {number|null} Valor del enjuague.
 */
export function getRinseValueFromMessage(message) {
    return _extractValueByCode(message, SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_R, parseInt);
}

/**
 * Calcula el valor del valor de alerta de flujo insuficiente a partir del mensaje que viene de la consula a la api o socket.
 * @param {String} message Mensaje que viene de una consulta a una api o del servidor.
 * @param {string | null} mvZeroValue Valor del caudal cero (mv_zero).
 * @returns {number|null} Valor de la alerta de flujo insuficiente en GPM, o null si no se puede calcular.
 */
export function getFlowAlertValueFromMessage(message, mvZeroValue) {
    const rawValue = _extractValueByCode(message, SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_F_ALERT, parseInt);
    if (rawValue === null || mvZeroValue === null) return null;
    return convertVoltageToGpm(rawValue, mvZeroValue);
}

/**
* Calcula el valor del valor de alarma insuficiente a partir del mensaje que viene de la consula a la api o socket.
 * @param {String} message Mensaje que viene de una consulta a una api o del servidor.
 * @param {string | null} mvZeroValue Valor del caudal cero (mv_zero).
 * @returns {number|null} Valor de la alarma de flujo insuficiente en GPM, o null si no se puede calcular.
 */
export function getInsufficientAlarmValueFromMessage(message, mvZeroValue) {
    const rawValue = _extractValueByCode(message, SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_F_ALARM, parseInt);
    if (rawValue === null || mvZeroValue === null) return null;
    return convertVoltageToGpm(rawValue, mvZeroValue);
}

/**
 * Convierte el valor del voltaje a gpm.
 * @param {int} voltageValue Valor del voltaje
 * @param {int} mvZeroValue Valor del caudal.
 * @returns {int} Valor de GPM.
 */
export function convertVoltageToGpm(voltageValue, mvZeroValue) {
    const resultConversion = Math.round((voltageValue - parseInt(mvZeroValue)) / 100);
    return resultConversion;
}

/**
 * Obtiene la operación que se está ejecutando de acuerdo al código de estado.
 * @param {int} statusCode Código de la operación
 * @returns {String} Operación que se está ejecutando.
 */
export function getOperationByStatusCode(statusCode) {
    const statesByCode = {
        20: "Contacto bomba activado. Esperando...",
        21: "Contacto bomba desactivado",
        54: "Planta habilitada por horario. Esperando...",
        55: "Planta deshabilitada por horario.",
        91: "Esperando horario o arranque manual",
        96: "Falla detectada. Modo StandBy",
    };
    if (statesByCode[statusCode]) {
        return statesByCode[statusCode];
    }
    const codFiltracion = [4, 6, 7, 8, 17, 19, 65, 66];
    if (codFiltracion.includes(statusCode)) {
        return "Filtración";
    }
    if (statusCode >= 0 && statusCode <= 3) {
        return "Tratamiento iniciando";
    }
    if (statusCode >= 9 && statusCode <= 15) {
        return "Retrolavado";
    }
    if (statusCode >= 30 && statusCode <= 35) {
        return "Enjuague";
    }
    return `Desconocido: ${statusCode}`;
}

/**
 * Determina si debe mostrar o no el valor del flujo actual de acuerdo a la operación que se está ejecutando.
 * @param {int} statusCode Código de la operación
 * @returns {boolean}si se debe mostrar o no el flujo actual en el panel de descripción.
 */
export function isCurrentFlowVisible(statusCode) {
    const codFiltracion = [4, 6, 7, 8, 17, 19, 65, 66];
    if (codFiltracion.includes(statusCode)) {
        return true;
    }
    if (statusCode >= 9 && statusCode <= 15) {
        return true;
    }
    if (statusCode >= 30 && statusCode <= 35) {
        return true;
    }
    return false;
}

/**
 * Obtiene el tipo de operación y su respectivo valor.
 * @param {String} message Mensaje que viene desde la consulta a la api o desde un evento del socket.
 * @param {string | null} mvZeroValue Valor del caudal cero (mv_zero).
 * @returns {{key: string, value: string|number}|null} Un objeto con la clave de la operación y su valor procesado, o `null` si el mensaje no es relevante.
 */
export function processSocketMessage(message, mvZeroValue) {
    if (!message) {
        return null;
    }
    const operationHandlers = {
        [SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_FIL]: { key: 'filtrado', calculate: (msg) => getFormattedTime('segundos', getFiltrationValueFromMessage(msg)) },
        [SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_B]: { key: 'retrolavado', calculate: (msg) => getFormattedTime('segundos', getInvWTimeValueFromMessage(msg)) },
        [SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_R]: { key: 'enjuague', calculate: (msg) => getFormattedTime('segundos', getRinseValueFromMessage(msg)) },
        [SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_F_ALERT]: { key: 'valorAlertaFlujo', calculate: (msg) => getFlowAlertValueFromMessage(msg, mvZeroValue) },
        [SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_F_ALARM]: { key: 'valorAlarmaInsuficiente', calculate: (msg) => getInsufficientAlarmValueFromMessage(msg, mvZeroValue) },
    };
    const errorMessages = {
        [SYRUS3_MESSAGE_HEADERS.RES_CMD_SET_FIL]: { key: 'filtrado', value: 'Parámetro inválido.' },
        [SYRUS3_MESSAGE_HEADERS.RES_CMD_SET_B]: { key: 'retrolavado', value: 'Parámetro inválido.' },
        [SYRUS3_MESSAGE_HEADERS.RES_CMD_SET_R]: { key: 'enjuague', value: 'Parámetro inválido.' },
        [SYRUS3_MESSAGE_HEADERS.RES_CMD_SET_F_ALERT]: { key: 'valorAlertaFlujo', value: 'Parámetro inválido.' },
        [SYRUS3_MESSAGE_HEADERS.RES_CMD_SET_F_ALARM]: { key: 'valorAlarmaInsuficiente', value: 'Parámetro inválido.' },
    }

    if (!message.includes(HEADER_MESSAGES_SOCKET.ERROR)) {
        for (const opKey in operationHandlers) {
            if (message.includes(opKey)) {
                const handler = operationHandlers[opKey];
                const value = handler.calculate(message);
                if (value !== null) {
                    return { key: handler.key, value };
                }
            }
        }
    } else {
        for (const errorKey in errorMessages) {
            if (message.includes(errorKey)) {
                return { key: errorMessages[errorKey].key, value: errorMessages[errorKey].value }
            }
        }
    }
    return null;
}
/**
 * Calcular el valor de flujo actual.
 * @param {int} currentValue valor que viene en el mensaje del websocket o de la consulta a la API.
 * @returns {int} valor del flujo actual.
 */
export function calculateCurrentFlow(currentValue) {
    let flowValue = currentValue / 100;
    if (flowValue >= 20) {
        flowValue = flowValue - 20;
    }
    const stateFlowValue = Math.round(flowValue * Math.pow(10, 2)) / Math.pow(10, 2);
    return stateFlowValue;
}

/**
 * Obtiene el código proceso que se está ejecutando en la planta.
 * @param {String} message Mensaje que viene del websocket por una query.
 * @returns {number|null} Código del proceso que se está ejecutando actualmente, o null si no se encuentra.
 */
export function getCodeCurrentProcess(message) {
    if (!message) {
        return null;
    }
    const match = message.match(/REV(\d{2})/);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    return null;
}

/**
 * Obtiene el valor del flujo actual de acuerdo a la información que manda el socket.
 * @param {String} message Mensaje que viene del websocket por una query.
 * @returns {number|string} valor del flujo actual, o una cadena vacía si no se encuentra.
 */
export function getFlowCurrentValue(message) {
    if (!message) return "";
    const match = message.match(/AD=(\d+);/);
    if (!match) return "";
    const value = calculateCurrentFlow(match[1], 10);
    return value;
}

/**
 * Calcula el valor de la filtración.
 * @param {float} caudalValue 
 * @param {float} countFiltered 
 * @returns {float} valor de la filtración.
 */
export function calculateAccumulatedValueFiltration(caudalValue, countFiltered) {
    return (caudalValue * countFiltered * 2);
}

/**
 * Calcula el valor del enjuague
 * @param {float} caudalValue 
 * @param {float} countFiltered 
 * @returns  {float}  valor del enjuague.
 */
export function calculateAccumulatedValueRinse(caudalValue, countRinse) {
    return caudalValue * countRinse * 2;
}

/**
 * Calcula el valor del retrolavado
 * @param {float} caudalValue  
 * @param {float} countInvWTime 
 * @returns  {float}  valor del retrolavado
 */
export function calculateAccumulatedValueInvWTime(caudalValue, countInvWTime) {
    return caudalValue * countInvWTime * 3;
}

/**
 * Realiza la conversión de gpm a voltage.
 * @param {String} gpmValue Valor de gpm en alertaflujo y alarmainsuficiente.
 * @param {String} mvZero valor que hace parte de la información de la planta.
 * @returns {int} valor converitido a voltage.
 */
export function convertGpmToVoltage(gpmValue, mvZero) {
    const result = (parseInt(gpmValue) * 100) + parseInt(mvZero);
    //si resultado es mayor a 15000 devolver error (Valor fuera de rango)
    return result;
}

const OPERATION_CONFIG = {
    [OPERATION_CODES.FILTRATION]: { name: "filtrado", header: SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_FIL, isAlert: false, maxValue: MAX_VALUE_OPERATIONS.FILTRATION },
    [OPERATION_CODES.INVW_TIME]: { name: "retrolavado", header: SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_B, isAlert: false, maxValue: MAX_VALUE_OPERATIONS.INVW_TIME },
    [OPERATION_CODES.RINSE]: { name: "enjuague", header: SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_R, isAlert: false, maxValue: MAX_VALUE_OPERATIONS.RINSE },
    [OPERATION_CODES.FLOW_ALERT]: { name: "alertaflujo", header: SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_F_ALERT, isAlert: true, maxValue: MAX_VALUE_OPERATIONS.FLOW_ALERT },
    [OPERATION_CODES.INSUFFICIENT_FLOW_ALARM]: { name: "alarmainsuficiente", header: SYRUS3_MESSAGE_HEADERS.RES_CMD_QED_F_ALARM, isAlert: true, maxValue: MAX_VALUE_OPERATIONS.INSUFFICIENT_FLOW_ALARM },
};

/**
 * Construye el comando set para cambiar los parametros de operación (filtración, retrolavado, enjuague, alarma y alerta).
 * Construye el string del comando a enviar al dispositivo para actualizar un parámetro.
 * @param {string} codeOperation  código de la operación (65:filtrado, 32:retrolavado, 12:enjuague, 03:alertaflujo, 00:alarmainsuficiente).
 * @param {int} value valor ingresado por el usuario.
 * @param {string} unitValue unidades, pueden ser segundos, minutos, horas o gpm.
 * @param {int} mvZero valor que hace parte de la información de la planta.
 * @returns {string} El comando formateado para enviar al dispositivo, o una cadena vacía si hay un error.
 */
export function buildSetterCommand(codeOperation, value, unitValue, mvZero) {
    const config = OPERATION_CONFIG[codeOperation];
    if (!config) {
        throw new Error(`Operación no válida para el código: ${codeOperation}`);
    }

    const messageTemplate = sessionStorage.getItem(config.name);
    if (!messageTemplate) {
        throw new Error(`No se encontró mensaje en sessionStorage para la operación: ${config.name}`);
    }

    const regex = new RegExp(`${config.header}(\\d+);`);
    const match = messageTemplate.match(regex);
    if (!match || !match[1]) {
        throw new Error(`El formato del mensaje para la operación ${config.name} es incorrecto.`);
    }

    let convertedValue;
    if (config.isAlert) {
        convertedValue = convertGpmToVoltage(value, mvZero);
    } else {
        convertedValue = getTime(unitValue, value);
    }

    if (convertedValue > config.maxValue) return "";

    const formattedValue = fillLeftText(convertedValue, 5);
    const baseMessage = replaceAt(messageTemplate.replace(/[<>]/g, ""), 0, "S");
    const messageWithValue = baseMessage.replace(match[1], formattedValue);

    return messageWithValue.replace(/;(SI|KY).*/, "");
}

/**
 * Realiza la conversión GPM a m3/min
 * @param {number} gpmValue - Valor de los galones por minuto 
 * @returns El valor convertido de m3/min
 */
export function gpmToCubicMetersPerMinute(gpmValue) {
    return gpmValue * 0.00378;
}

/**
 * Elimina las variables que se guardan en sesión.
 * @returns void
 */
export function clearAllSessionStorage() {
    // Itera sobre todos los valores del objeto de claves y los elimina.
    Object.values(SESSION_STORAGE_KEYS_TO_USE).forEach(key => {
        sessionStorage.removeItem(key);
    });
};