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
    for (const opKey in operationHandlers) {
        if (message.includes(opKey)) {
            const handler = operationHandlers[opKey];
            const value = handler.calculate(message);
            if (value !== null) {
                return { key: handler.key, value };
            }
        }
    }
    return null;
}

export function calculateStateFlow(currentValue) {
    let flowValue = currentValue / 100;
    if (flowValue >= 20) {
        flowValue = flowValue - 20;
    }
    const stateFlowValue = Math.round(flowValue * Math.pow(10, 2)) / Math.pow(10, 2);
    return stateFlowValue;
}


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

export function getFlowCurrentlyValue(message) {
    const match = message.match(/AD=(\d+);/);
    if (!match) return "";
    const value = calculateStateFlow(match[1], 10);
    return value;
}

export function thousandsSeparator(num) {
    var num_parts = num.toString().split(".");
    num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return num_parts.join(".");
}