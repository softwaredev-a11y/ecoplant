import { replaceAt, fillLeftText } from "./syrusUtils";
import { SYRUS4_SET_PARAMETER_KEYS, SYRUS_FOUR_COMMANDS } from "./constants";
import { formatHour12, toGMT0, convertTo24h, toGMT5 } from "./timeUtils"

/**
 * Procesa el mensaje de socket de un Syrus para obtener y formatear el horario de operación.
 * @param {string | null | undefined} message - El mensaje del socket a procesar.
 * @returns {string | null} Una cadena de texto con el horario de operación en formato local (ej: "08:00 a.m a 05:00 p.m") o null si no se pudo procesar.
 */
export function generateOperationHours(messages) {
    const qgt00 = messages['RGT001'];
    const qgt01 = messages['RGT011'];
    if (!qgt00 || !qgt01) return "Parámetro inválido.";
    const response = qgt00.substring(1, 23).concat(qgt01.substring(23, qgt01.length - 1));
    const startTime = response.charAt(12).concat(response.charAt(13));
    const endTime = response.charAt(24).concat(response.charAt(25));
    const schedule = formatOperationHours(startTime, endTime);
    return schedule;
}

/**
 * Formatea un rango de horas de operación (en GMT 0) a una cadena de texto legible en hora local (GMT-5).
 * Esta función es compatible tanto para Syrus 3 como para Syrus 4.
 * Si la hora de inicio y fin son iguales, se asume un horario de 24 horas.
 * @param {number} startTime - La hora de inicio en formato 24h (GMT 0).
 * @param {number} endTime - La hora de fin en formato 24h (GMT 0).
 * @returns {string} El horario formateado en formato 12h local (ej: "08:00 a.m a 05:00 p.m") o "24 horas".
 */
export function formatOperationHours(startTime, endTime) {
    const startLocal = toGMT5(startTime);
    const endLocal = toGMT5(endTime);
    const schedule = `${formatHour12(startLocal)}:00 ${startLocal >= 12 ? 'p.m' : 'a.m'} a ${formatHour12(endLocal)}:00 ${endLocal >= 12 ? 'p.m' : 'a.m'}`;
    return startTime === endTime ? "24 horas" : schedule;
}

/**
 * Construye los comandos SGT para establecer el horario de operación en un Syrus4.
 * @param {string} startTime - Hora de inicio en formato 12h (ej: "7:00 pm")
 * @param {string} endTime - Hora de fin en formato 12h (ej: "3:00 am")
 * @returns {string[]} Lista de comandos SGT a enviar al dispositivo.
 */
export function buildSetOperationHoursCommand(startTime, endTime) {
    const BASE_COMMAND = "SGT001000000130000000000000000";
    const SPLIT_COMMAND = "SGT011000000000000000000000000";
    const commandsToSend = [];

    // --- 1. Parsear horas a formato 24h
    const startHour24 = convertTo24h(startTime);
    const endHour24 = convertTo24h(endTime);

    // --- 2. Convertir a GMT 0
    const startHourGMT = toGMT0(startHour24);
    const endHourGMT = toGMT0(endHour24);

    // --- 3. Reemplazar hora de inicio en el comando base
    let command = replaceAt(BASE_COMMAND, 12, startHourGMT[0]);
    command = replaceAt(command, 13, startHourGMT[1]);

    // --- 4. Determinar si se necesitan múltiples SGT
    const needsSplit = (endHourGMT >= 1 && endHourGMT < 12) || startHourGMT === endHourGMT;

    if (needsSplit) {
        // Caso 1: Se requiere división en dos comandos (hasta 23:59:59 y luego desde 00:00:00)
        const firstCommand = command.substring(0, 24) + "235959";
        let secondCommand = replaceAt(SPLIT_COMMAND, 24, endHourGMT[0]);
        secondCommand = replaceAt(secondCommand, 25, endHourGMT[1]);
        const thirdCommand = replaceAt(firstCommand, 4, "2");
        commandsToSend.push(firstCommand, secondCommand, thirdCommand);
    } else {
        // Caso 2: Un solo bloque con hora de fin
        let endCommand;
        if (endHourGMT === 0) {
            // Si termina a medianoche, forzar 23:59:59
            endCommand = command.substring(0, 24) + "235959";
        } else {
            endCommand = replaceAt(command, 24, endHourGMT[0]);
            endCommand = replaceAt(endCommand, 25, endHourGMT[1]);
        }
        commandsToSend.push(
            endCommand,
            replaceAt(endCommand, 4, "1"),
            replaceAt(endCommand, 4, "2")
        );
    }

    return commandsToSend;
}

/**
 * Construye el comando para establecer el horario de operación en un dispositivo Syrus 4.
 * @param {string} startTime - La hora de inicio (ej. "8 a", "10 p").
 * @param {string} endTime - La hora de fin (ej. "5 p", "6 a").
 * @returns {string} El comando formateado para enviar al dispositivo.
 */
export function buildSetOperationHoursCommandSyrus4(startTime, endTime) {
    const to12HourFormat = (hourStr) => {
        if (!hourStr) return "00:00";
        const isPM = hourStr.toLowerCase().includes('p');
        let hour = parseInt(hourStr.replace(/\s*[ap]/i, ''), 10);
        if (isPM && hour < 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        hour = (hour + 5) % 24;
        const newIsPM = hour >= 12;
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        return `${fillLeftText(displayHour, 2)}-00-${newIsPM ? 'pm' : 'am'}`;
    };
    const commandContent = `{"${SYRUS4_SET_PARAMETER_KEYS.CMD_SET_START_TIME}":"${to12HourFormat(startTime)}","${SYRUS4_SET_PARAMETER_KEYS.CMD_SET_END_TIME}":"${to12HourFormat(endTime)}"}`;
    return `${SYRUS_FOUR_COMMANDS.SET_ECOPLANT_PARAM} "${commandContent}"`;
}

/**
 * Extrae un valor de hora (que se espera esté entre comillas) de un mensaje de respuesta
 * del socket de Syrus 4.
 * @param {string | null | undefined} message - El mensaje completo del cual extraer el valor.
 * @param {string} code - La clave a buscar en el mensaje (ej: "START_TIME || END_TIME").
 * @returns {string | null} El valor de la hora extraído (incluyendo comillas) o null si no se encuentra.
 */
function _extractOperationHour(message, code) {
    if (!message) return null;

    // Captura el valor completo incluyendo comillas
    const regex = new RegExp(`["']?${code}["']?:\\s*("(?:[^"]+)"|'(?:[^']+)')`);
    const match = message.match(regex);

    if (!match) {
        console.warn(`No se encontró ${code} en el mensaje:`, message);
        return null;
    }
    const valueWithQuotes = match[1];

    return valueWithQuotes;
}

/**
 * Procesa un mensaje de socket de un Syrus 4 para obtener y formatear el horario de operación.
 * @param {string | null | undefined} message - El mensaje del socket a procesar.
 * @returns {string | null} Una cadena de texto con el horario de operación en formato local (ej: "08:00 a.m a 05:00 p.m") o null si no se pudo procesar.
 */
export function getSyrus4OperationHours(message) {
    if (!message) return null;

    const startTimeRaw = _extractOperationHour(message, "start_time");
    const endTimeRaw = _extractOperationHour(message, "end_time");
    if (!startTimeRaw || !endTimeRaw) return null;

    const startHour24 = convertTo24h(startTimeRaw);
    const endHour24 = convertTo24h(endTimeRaw);
    if (startHour24 === null || endHour24 === null) return null;

    return formatOperationHours(startHour24, endHour24);
}

/**
 * Revisa el mensaje del socket, para determinar si el mensaje está relacionado a los horarios de operación.
 * @param {string | null | undefined} message - El mensaje del socket a procesar.
 * @returns {boolean} Valor booleando que demuestra el si el mensaje es o no de horarios de operación.
 */
export function isScheduleMessage(message) {
    return message.includes('RGT001') || message.includes('RGT011') || message.includes('RGT021') || (message.includes(`"start_time"`) && message.includes(`"end_time"`)) || message.includes('SGT001') || message.includes('SGT011') || message.includes('SGT021');
}

/**
 * Extrae los primeros 6 caracteres del mensaje para utilizarlos como identificadores. EJ: RGT001, RGT011, RGT0021
 * @param {string | null | undefined} message - El mensaje del socket a procesar.
 * @returns {string || null} Una cadena de texto con la cabecera del mensaje
 */
export function extractScheduleMessageHeader(message) {
    return message.substring(1, 7);
}