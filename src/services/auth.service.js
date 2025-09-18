import axiosInstance from "./axiosInstance";

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
    login: (data) => axiosInstance.post("/login", data),
    /**
     * Realiza una petición GET para cerrar la sesión.
     * @returns {Promise} Una promesa que resuelve con la respuesta de la API.
     */
    logout: () => axiosInstance.get('/logout')
};

export default authApi;