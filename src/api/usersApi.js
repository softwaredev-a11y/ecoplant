import axiosInstance from "./axiosInstance";
/**
  * Objeto que agrupa las llamadas a la API relacionadas a los usuarios
 */
const usersApi = {
    /**
     * Obtiene la información del usuario que se autenticó en la aplicación.
     * @returns {Promise} - Una respuesta con la promesa de la API. 
     */
    getUser: () => axiosInstance.get('/user')
}

export default usersApi;