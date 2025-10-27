import { apiPegasusInstance, apiCloudInstance, apiProxyInstance } from "./axiosInstance";

/**
 * Objeto que agrupa las llamadas a la API relacionadas con la autenticación.
 * @property {function(object): Promise} login - Envía las credenciales para iniciar sesión.
 * @property {function(): Promise} logout - Cierra la sesión del usuario.
 */
const authApi = {
    /**
     * Realiza una petición POST para iniciar sesión.
     * @param {object} data - Los datos para el inicio de sesión { username, password }.
     * @returns {Promise} Una promesa que resuelve con la respuesta de la API.
     */
    login: (data) => apiPegasusInstance.post("/login", data),
    /**
     * Realiza una petición GET para cerrar la sesión.
     * @returns {Promise} Una promesa que resuelve con la respuesta de la API.
     */
    logout: () => apiPegasusInstance.get('/logout'),
    /**
     * Realiza una petición POST para iniciar sesión.
     * @returns {Promise} Una promesa que resuelve con la respuesta de la API.
     */
    cloudLogin: () => apiProxyInstance.post("/api/cloud_login.php"),
    /**
     * Realiza petición POST para cerrar la sesión
     *  @returns {Promise} Una promesa que resuelve con la respuesta de la API.
     */
    cloudLogout: () => apiCloudInstance.post("/auth/logout"),
    /**
     * Realiza petición post para cerrar la sesión de Pegasus incluso si se cierra el navegador.
     * @param {string} pegasusToken 
     */
    logoutPegasusFetch: (pegasusToken) => {
        fetch(`${import.meta.env.VITE_API_URL}/logout`, {
            method: 'GET',
            headers: { 'authenticate': `${pegasusToken}`, accept: "application/json" },
            keepalive: true
        });
    },
    /**
     * Realiza petición post para cerrar la sesión del cloud incluso si se cierra el navegador.
     * @param {string} cloudToken 
     */
    logoutCloudFetch: (cloudToken) => {
        fetch(`${import.meta.env.VITE_API_CLOUD_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `${cloudToken}`, accept: "application/json" },
            keepalive: true
        });
    }
};
export default authApi;