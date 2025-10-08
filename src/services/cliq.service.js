/**
 * Envía un mensaje de log al servicio de Cliq.
 * Esta función es "fire-and-forget", lo que significa que no bloquea la ejecución
 * para esperar una respuesta, pero sí captura y maneja silenciosamente
 * cualquier error que pueda ocurrir durante el envío.
 *
 * @param {string} message - El mensaje a enviar.
 */
export async function sendLogToCliq(message) {
    const cliqApiUrl = `${import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`}api/cliq-login.php`.replace('//', '/');
    try {
        await fetch(cliqApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message }),
        });
    } catch (error) {
        console.error("Error al enviar el log a Cliq:", error);
    }
}