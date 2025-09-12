export function getPlantModel(text) {
    const match = text.match(/\*type:Ecoplant\s*(\d+)/i);
    if (match) {
        return parseInt(match[1], 10);
    }
    return 'Sin información disponible';
}

export function searchPlant(plants, idPlant) {
    const plant = plants.find(p => String(p.id) === String(idPlant));
    return plant;
}

export function getMvZeroText(descripcion) {
    const match = descripcion.match(/mv_zero:(.*?)\nEND_PARAMS/s);
    return match ? match[1] : null;
}

export function formatTime(unitTime, time) {
    let totalSeconds = getTimeInSeconds(unitTime, time);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const parts = [];
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "minuto" : "minutos"}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} ${seconds === 1 ? "segundo" : "segundos"}`);
    return parts.length > 1
        ? parts.slice(0, -1).join(" ") + " y " + parts.slice(-1)
        : parts[0];
}

export function getTimeInSeconds(unitTime, time) {
    let totalSeconds = 0;
    switch (unitTime.toLowerCase()) {
        case "segundos":
            totalSeconds = time;
            break;
        case "minutos":
            totalSeconds = time * 60;
            break;
        case "horas":
            totalSeconds = time * 3600;
            break;
        default:
            throw new Error("Unidad no válida. Usa 'segundos', 'minutos' o 'horas'.");
    }
    return totalSeconds;
}

export function getSoftwareVersion(configuration) {
    const mapConfigurations = { "p458": "1.2", "q111": "1.3", "q149": "1.4", "q537": "2.0", "r058": "3.0 1Horario", "r347": "1.0 AguaFria" };
    return mapConfigurations[configuration] || "0.0";
}

export function buildDate(year, month, day) {
    return `${year}-${fillLeftText(month, 2)}-${fillLeftText(day, 2)}`;
}

export function fillLeftText(num, padlen, padchar = '0') {
    return String(num).padStart(padlen, padchar);
}

export function calculateFiltrationValue(message) {
    if (!message) return null;
    const match = message.match(/SGC04TC(\d+);/);
    if (!match) return null;
    const rawValue = parseInt(match[1], 10);
    return rawValue;
}

export function calculateBackwashValue(message) {
    if (!message) return null;
    const match = message.match(/SGC07TC(\d+);/);
    if (!match) return null;
    const rawValue = parseFloat(match[1], 10);
    return rawValue;
}

export function calculateRinseValue(message) {
    if (!message) return null;
    const match = message.match(/SGC10TC(\d+);/);
    if (!match) return null;
    const rawValue = parseFloat(match[1], 10);
    return rawValue;
}

export function calculateFlowAlertValue(message, mvZeroValue) {
    if (!message) return null;
    const match = message.match(/RXAGA03V(\d+);/);
    if (!match) return null;
    const rawValue = parseInt(match[1], 10);
    const rawValueToGpm = conversionToGpm(rawValue, mvZeroValue);
    return rawValueToGpm;
}

export function calculateInsufficientAlarmValue(message, mvZeroValue) {
    if (!message) return null;
    const match = message.match(/RXAGA00V(\d+);/);
    if (!match) return null;
    const rawValue = parseInt(match[1], 10);
    const rawValueToGpm = conversionToGpm(rawValue, mvZeroValue);
    return rawValueToGpm;
}

export function conversionToGpm(voltageValue, mvZeroValue) {
    const resultConversion = Math.round((voltageValue - parseInt(mvZeroValue)) / 100);
    return resultConversion;
}

export function stateProcess(statusCode) {
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

export function showCurrentFlow(statusCode) {
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
 * 
 * @param {String} message 
 * @param {int} mvZeroValue 
 * @returns 
 */
export function processSocketMessage(message, mvZeroValue) {
    if (!message) {
        return null;
    }
    const operationHandlers = {
        'SGC04TC': { key: 'filtrado', calculate: (msg) => formatTime('segundos', calculateFiltrationValue(msg)) },
        'SGC07TC': { key: 'retrolavado', calculate: (msg) => formatTime('segundos', calculateBackwashValue(msg)) },
        'SGC10TC': { key: 'enjuague', calculate: (msg) => formatTime('segundos', calculateRinseValue(msg)) },
        'RXAGA03V': { key: 'valorAlertaFlujo', calculate: (msg) => calculateFlowAlertValue(msg, mvZeroValue) },
        'RXAGA00V': { key: 'valorAlarmaInsuficiente', calculate: (msg) => calculateInsufficientAlarmValue(msg, mvZeroValue) },
    };
    const errorMessages = {
        'SED06NA0': { key: 'filtrado', value: 'Párametro inválido.' },
        'SED14NV0': { key: 'retrolavado', value: 'Párametro inválido.' },
        'SED34NV0': { key: 'enjuague', value: 'Párametro inválido.' },
        'SXAGA03': { key: 'valorAlertaFlujo', value: 'Párametro inválido.' },
        'SXAGA00': { key: 'valorAlarmaInsuficiente', value: 'Párametro inválido.' },

    }
    if (!message.includes('RER')) {
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
 * @returns valor del flujo actual.
 */
export function calculateStateFlow(currentValue) {
    let flowValue = currentValue / 100;
    if (flowValue >= 20) {
        flowValue = flowValue - 20;
    }
    const stateFlowValue = Math.round(flowValue * Math.pow(10, 2)) / Math.pow(10, 2);
    return stateFlowValue;
}

/**
 * Obtiene el proceso que se está ejecutando en la planta.
 * @param {String} message Mensaje que viene del websocket por una query.
 * @returns Proceso que se está ejecutando actualmente.
 */
export function getCodeCurrentProccess(message) {
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
 * @returns valor del flujo actual.
 */
export function getFlowCurrentlyValue(message) {
    const match = message.match(/AD=(\d+);/);
    if (!match) return "";
    const value = calculateStateFlow(match[1], 10);
    return value;
}

/**
 * Separa un número en miles.
 * @param {int} num 
 * @returns número formateado con separador de miles.
 */
export function thousandsSeparator(num) {
    var num_parts = num.toString().split(".");
    num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return num_parts.join(".");
}

/**
 * Calcula el valor de la filtración.
 * @param {*} caudalValue 
 * @param {*} countFiltered 
 * @returns valor de la filtración.
 */
export function calculateAccumulatedValueFiltration(caudalValue, countFiltered) {
    return (caudalValue * countFiltered * 2);

}

/**
 * Calcula el valor del enjuague
 * @param {float} caudalValue 
 * @param {float} countFiltered 
 * @returns valor del enjuague.
 */
export function calculateAccumulatedValueRinse(caudalValue, countFiltered) {
    return caudalValue * countFiltered * 2;
}

/**
 * Calcula el valor del retrolavado
 * @param {float} caudalValue  
 * @param {float} countBackwash 
 * @returns valor del retrolavado
 */
export function calculateAccumulatedValueBackwash(caudalValue, countBackwash) {
    return caudalValue * countBackwash * 3;
}

/**
 * Modifica un carácter con índice especifico en un string.
 * @param {String} str Cadena a modificar
 * @param {int} index índice del carácter que se va a modificar.
 * @param {String} replacement Cáracter que se va a poner en la cadena.
 * @returns cadena de texto con el nuevo caracter.
 */
export function replaceAt(str, index, replacement) {
    if (index < 0 || index >= str.length) return str; // índice inválido
    return str.slice(0, index) + replacement + str.slice(index + 1);
}

/**
 * Realiza la conversión de gpm a voltage.
 * @param {String} gpmValue Valor de gpm en alertaflujo y alarmainsuficiente.
 * @param {String} mvZero valor que hace parte de la información de la planta.
 * @returns valor converitido a voltage.
 */
export function conversionToVoltage(gpmValue, mvZero) {
    const result = (parseInt(gpmValue) * 100) + parseInt(mvZero);
    //si resultado es mayor a 15000 devolver error (Valor fuera de rango)
    return result;
}

/**
 * Obtiene el comando set para cambiar los parametros de operación.
 * @param {String} codeOperation  código de la operación (65:filtrado, 32:retrolavado, 12:enjuague, 03:alertaflujo, 00:alarmainsuficiente) 
 * @param {boolean} isAlertOperation determina si la operación es por alerta, o alarma.
 * @param {int} value valor ingresado por el usuario.
 * @param {String} unitValue unidades, pueden ser segundos, minutos, horas o gpm.
 * @param {int} mvZero valor que hace parte de la información de la planta.
 * @returns El comando para realizar la modificación.
 */
export function getSetterMessage(codeOperation, isAlertOperation, value, unitValue, mvZero) {
    const proccess = { "65": "filtrado", "32": "retrolavado", "12": "enjuague", "03": "alertaflujo", "00": "alarmainsuficiente" };
    const operation = proccess[codeOperation];
    if (!operation) {
        console.error(`Operación no válida para el código: ${codeOperation}`);
        return "";
    }

    const message = sessionStorage.getItem(operation);
    if (!message) {
        console.error(`No se encontró mensaje en sessionStorage para la operación: ${operation}`);
        return "";
    }

    const header = getHeaderMessage(codeOperation);
    const regex = new RegExp(`${header}(\\d+);`);
    const match = message.match(regex);

    if (!match || !match[1]) {
        console.error(`El formato del mensaje para la operación ${operation} es incorrecto. No se pudo encontrar el valor a reemplazar.`);
        return "";
    }
    const newMessage = replaceAt(message.replace(/[<>]/g, ""), 0, "S");
    let formattedValue;
    let convertedValue;
    if (isAlertOperation) {
        convertedValue = conversionToVoltage(value, mvZero);
        if (convertedValue > 15000) return "";
        formattedValue = fillLeftText(convertedValue, 5);
    } else {
        convertedValue = getTimeInSeconds(unitValue, value);
        if (convertedValue > 99999) return "";
        formattedValue = fillLeftText(convertedValue, 5);
    }
    const formatMessage = newMessage.replace(`${match[1]}`, `${formattedValue}`);
    const messageWithoutSi = formatMessage.replace(/;SI.*/, "");
    const messageWithoutkY = messageWithoutSi.replace(/;KY.*/, "");
    return messageWithoutkY;
}

/**
 * Obtiene la cabecera del comando, de acuerdo al código de la operación.
 * @param {String} codeOperation código de la operación (65:filtrado, 32:retrolavado, 12:enjuague, 03:alertaflujo, 00:alarmainsuficiente) 
 * @returns la cabecera del comando.
 */
export function getHeaderMessage(codeOperation) {
    const proccess = { "65": "SGC04TC", "32": "SGC07TC", "12": "SGC10TC", "03": "RXAGA03V", "00": "RXAGA00V" };
    return proccess[codeOperation];
}