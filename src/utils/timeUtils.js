import { fillLeftText } from "./syrusUtils";

/**
 * Convierte una hora en formato de 24h a formato de 12h.
 * @param {number} hour24 Hora en formato militar (0-23).
 * @returns {string} La hora formateada en 12h como una cadena de 2 dígitos (ej. "08", "12").
 */
export function formatHour12(hour24) {
    const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return fillLeftText(hour, 2);
};

/**
 * Convierte una hora de GMT-5 a GMT 0.
 * @param {number} hour24 La hora en formato de 24h (GMT-5).
 * @returns {string} La hora convertida a GMT 0, como una cadena de 2 dígitos.
 */
export function toGMT0(hour24) {
    return fillLeftText((hour24 + 5) % 24, 2);
}

/**
 * Convierte una cadena de tiempo en formato 12h (ej. "8 am", "10 p.m.") a un número en formato 24h.
 * @param {string} timeStr La cadena de tiempo a convertir.
 * @returns {number} La hora en formato de 24h (0-23).
 */
export function convertTo24h(timeStr) {
    const hour = parseInt(timeStr.replace(/\s*[ap]\.?m?\.?/i, ''), 10);
    const isPm = timeStr.toLowerCase().includes('p');
    if (isPm && hour < 12) return hour + 12;
    if (!isPm && hour === 12) return 0; // Medianoche es 0 en formato 24h
    return hour;
}

/**
 * Convierte una hora de GMT 0 a GMT-5 (hora local).
 * @param {number} hour La hora en formato 24h (GMT 0).
 * @returns {number} La hora convertida a GMT-5.
 */
export function toGMT5(hour) {
    let localHour = (hour - 5 + 24) % 24;
    return localHour;
};