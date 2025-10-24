/**
 * Envía un mensaje de log al canal de Cliq (#Ecoplant-Logs).
 *
 * @param {string} message - El mensaje a enviar.
 */
import  {apiProxyInstance}  from "./axiosInstance";

const logsToCliq = {
    /**
     * Envía el mensaje de log al proxy que se comunica con Cliq.
     * @param {string} message - El mensaje de log formateado.
     */
    sendLogToCliq: (message) => apiProxyInstance.post("/api/cliq_login.php", { message })
 
}

export default logsToCliq;