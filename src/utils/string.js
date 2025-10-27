/**
 * Contruye una fecha con el siguiente formato: YYYY-MM-DD
 * @param {String} year año de la fecha a formatear
 * @param {String} month  mes de la fecha a formatear
 * @param {String} day día de la fecha a formatear
 * @returns {String} Fecha formateada.
 */
export function buildDate(year, month, day) {
    return `${year}-${fillLeftText(month, 2)}-${fillLeftText(day, 2)}`;
}

/**
 * Pone n carácteres a la izquierda de un número
 * @param {int} num  Número a modificar
 * @param {int} padlen Cantidad total de números/caracteres que va a tener.
 * @param {char} padchar Caracter que se va a poner a la izquierda, por defecto está en 0.
 * @returns {String} Número formateado con 0 al izquierda.
 */
export function fillLeftText(num, padlen, padchar = '0') {
    return String(num).padStart(padlen, padchar);
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
 * Modifica un carácter con índice especifico en un string.
 * @param {String} str Cadena a modificar
 * @param {int} index índice del carácter que se va a modificar.
 * @param {String} replacement Cáracter que se va a poner en la cadena.
 * @returns {String} cadena de texto con el nuevo caracter.
 */
export function replaceAt(str, index, replacement) {
    if (index < 0 || index >= str.length) return str; // índice inválido
    return str.slice(0, index) + replacement + str.slice(index + 1);
}
