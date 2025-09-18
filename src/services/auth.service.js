import { apiPegasusInstance, apiCloudInstance } from "./axiosInstance";

/**
 * Objeto que agrupa las llamadas a la API relacionadas con la autenticación.
 * @property {function(object): Promise} login - Envía las credenciales para iniciar sesión.
 * @property {function(): Promise} logout - Cierra la sesión del usuario.
 */
const authApi = {
    /**
     * Realiza una petición POST para iniciar sesión.
     * @param {object} data - Los datos para el inicio de sesión, generalmente { username, password }.
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
     * @param {object} data - Los datos para el inicio de sesión, generalmente { email, password }.
     * @returns {Promise} Una promesa que resuelve con la respuesta de la API.
     */
    cloudLogin: (data) => apiCloudInstance.post("/auth/login", data),
    /**
     * Realiza petición POST para cerrar la sesión
     *  @returns {Promise} Una promesa que resuelve con la respuesta de la API.
     */
    cloudLogout: () => apiCloudInstance.post("/auth/logout")
};

export default authApi;