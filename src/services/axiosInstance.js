import axios from "axios";

const axiosInstance = axios.create({
    /**
     * La URL base para todas las peticiones de la API.
     * Se obtiene de las variables de entorno de Vite.
     * @type {string}
     */
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "accept": "application/json",
    },
    /**
     * Tiempo máximo de espera para una petición en milisegundos.
     * @type {number}
     */
    timeout: 10000,
});

/**
 * Interceptor de peticiones de Axios.
 * Se ejecuta antes de que cada petición sea enviada. Su propósito principal es
 * inyectar el token de autenticación en las cabeceras.
 */
axiosInstance.interceptors.request.use(
    (config) => {
        // Obtiene el token de autenticación desde sessionStorage.
        const token = sessionStorage.getItem("token");
        if (token) {
            // Si el token existe, lo añade a la cabecera 'authenticate'.
            config.headers.authenticate = `${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error) // Para errores en la configuración de la petición.
);

/**
 * Interceptor de respuestas de Axios.
 * Se ejecuta después de recibir una respuesta. Permite gestionar respuestas
 * exitosas y errores de forma centralizada.
 */
axiosInstance.interceptors.response.use(
    (response) => response, // Para respuestas exitosas (código 2xx), simplemente se devuelve la respuesta.
    (error) => {
        // Se centraliza el log de errores de las peticiones.
        if (error.response) {
            // El servidor respondió con un código de estado fuera del rango 2xx.
            console.error("Error de respuesta del servidor:", error.response.status, error.response.data);
        } else if (error.request) {
            // La petición se hizo, pero no se recibió respuesta.
            console.error("No se recibió respuesta del servidor:", error.request);
        } else {
            // Ocurrió un error al configurar la petición que lanzó un Error.
            console.error("Error en la configuración de la petición:", error.message);
        }
        // Se rechaza la promesa para que el error pueda ser capturado por el .catch() correspondiente.
        return Promise.reject(error);
    }
);

export default axiosInstance;