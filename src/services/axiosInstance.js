import axios from "axios";

/**
 * Crea una instancia de Axios configurada con baseURL, headers e interceptores.
 * 
 * @param {string} baseURL - URL base de la API.
 * @param {string} tokenKey - Clave en sessionStorage donde está el token.
 * @param {string} authHeader - Nombre de la cabecera de autenticación.
 * @returns {import("axios").AxiosInstance} Instancia de Axios configurada.
 */
function createApiInstance(baseURL, tokenKey, authHeader = "Authorization") {
    const instance = axios.create({
        baseURL,
        headers: {
            accept: "application/json",
        },
        timeout: 10000,
    });

    // Interceptor de request → añade token
    instance.interceptors.request.use(
        (config) => {
            const token = sessionStorage.getItem(tokenKey);
            if (token) {
                config.headers[authHeader] = token;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Interceptor de response → maneja errores
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response) {
                console.error(
                    "Error de respuesta del servidor:",
                    error.response.status,
                    error.response.data
                );
            } else if (error.request) {
                console.error("No se recibió respuesta del servidor:", error.request);
            } else {
                console.error("Error en la configuración de la petición:", error.message);
            }
            return Promise.reject(error);
        }
    );

    return instance;
}

// Instancias específicas
const apiPegasusInstance = createApiInstance(
    import.meta.env.VITE_API_URL,
    "token",
    "authenticate"
);

const apiCloudInstance = createApiInstance(
    import.meta.env.VITE_API_CLOUD_URL,
    "cloudToken",
    "Authentication"
);
export { apiPegasusInstance, apiCloudInstance };