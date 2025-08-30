import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "accept": "application/json",
    },
    timeout: 10000,
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem("token");
        if (token) {
            config.headers.authenticate = `${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error("Error del servidor:", error.response.status, error.response.data);
        } else if (error.request) {
            console.error("No hubo respuesta del servidor");
        } else {
            console.error("Error en la petición:", error.message);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;