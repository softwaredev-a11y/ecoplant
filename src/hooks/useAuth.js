import { useNavigate } from 'react-router-dom';
import { useCallback, useState } from 'react';
import authApi from '@/services/auth.service';
import axios from 'axios';
import { clearAllSessionStorage } from "../utils/syrusUtils"
import { SESSION_STORAGE_KEYS_TO_USE } from '@/constants/constants';

/**
* Hook personalizado para gestionar la autenticación del usuario.
* Proporciona un conjunto de funciones para manejar el ciclo de vida de la sesión,
* incluyendo el inicio de sesión, cierre de sesión, renovación de token y
* el manejo del cierre del navegador.
* @returns {useAuth} Un objeto con las funciones de autenticación.
*/
export const useAuth = () => {
    const navigate = useNavigate();
    const [isLoadingLogin, setIsLoadingLogin] = useState(false);

    /**
     * Realiza el proceso de inicio de sesión.
     * Envía las credenciales a la API y, si tiene éxito, almacena la información
     * de la sesión (token, nombre de usuario, etc.) en `sessionStorage` y redirige
     * al usuario al dashboard.
     * @param {object} credentials - Las credenciales del usuario.
     * @param {string} credentials.username - El nombre de usuario (email).
     * @param {string} credentials.password - La contraseña del usuario.
     * @throws {Error} Lanza un error si la autenticación falla, permitiendo que el componente que lo llama maneje el error (por ejemplo, para mostrar un mensaje).
     */
    const login = async (credentials) => {
        let pegasusToken = null; // Variable para almacenar el token temporalmente
        try {
            //Envía la información del usuario (email, passowrd)
            setIsLoadingLogin(true);
            const { data } = await authApi.login(credentials);
            // Construye la URL de forma dinámica para que funcione en desarrollo y producción.
            // En producción, BASE_URL será '/apps/ecoplant/'.
            const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
            pegasusToken = data.auth; // Guardamos el token en cuanto lo recibimos
            const apiUrl = `${baseUrl}api/cloud_login.php`.replace('//', '/');
            const responseCloud = await fetch(apiUrl, { method: 'POST' });
            if (!responseCloud.ok) {
                throw new Error(`El proxy de Cloud falló con estado: ${responseCloud.status}`);
            }
            const cloudData = await responseCloud.json();
            //Si es exitoso, almacena la siguiente información en variables de session.
            sessionStorage.setItem(SESSION_STORAGE_KEYS_TO_USE.PEGASUS_TOKEN, pegasusToken);
            sessionStorage.setItem(SESSION_STORAGE_KEYS_TO_USE.AUTH, true)
            sessionStorage.setItem(SESSION_STORAGE_KEYS_TO_USE.CLOUD_TOKEN, cloudData?.token);
            sessionStorage.setItem(SESSION_STORAGE_KEYS_TO_USE.ADM_TOKEN, cloudData?.token_pegasus);
            //Redirige al dashboard.
            navigate('/dashboard');
        } catch (error) {
            console.error("Fallo al iniciar sesión:", error);
            /**
             * Validación que elimina el token de sesión de Pegasus en caso de que no se pueda
             * ingresar a cloud.
             */
            if (pegasusToken) {
                try {
                    await axios.get(`${import.meta.env.VITE_API_URL}/logout`, {
                        headers: { authenticate: pegasusToken }
                    });
                } catch (logoutError) {
                    console.error("Fallo al intentar revertir el logout de Pegasus:", logoutError);
                }
            }
            throw error;
        } finally {
            setIsLoadingLogin(false);
        }
    };
    /**
     * Cierra la sesión del usuario.
     * Intenta notificar al servidor sobre el cierre de sesión, y luego limpia
     * toda la información de la sesión almacenada en `sessionStorage`,
     * independientemente de si la llamada a la API fue exitosa. Finalmente,
     * redirige al usuario a la página de inicio.
     */
    const logout = async () => {
        try {
            await authApi.logout();
            await authApi.cloudLogout();
        } catch (error) {
            console.error("Fallo al cerrar sesión en el servidor:", error);
        } finally {
            //Elimina información almacenada en variables de session.
            clearAllSessionStorage();
            //Redirige a la página de inicio/login
            navigate('/');
        }
    };
    /**
     * Elimina el token cuando se cierra la ventana del navegador.
     */
    const logoutOnBrowserClose = useCallback(() => {
        const logoutUrl = `${import.meta.env.VITE_API_URL}/logout`;
        const logoutCloud = `${import.meta.env.VITE_API_CLOUD_URL}/auth/logout`
        const token = sessionStorage.getItem(SESSION_STORAGE_KEYS_TO_USE.PEGASUS_TOKEN);
        const cloudToken = sessionStorage.getItem(SESSION_STORAGE_KEYS_TO_USE.USER_DATA.CLOUD_TOKEN);
        if (token) {
            fetch(logoutUrl, {
                method: 'GET',
                headers: {
                    'authenticate': `${token}`
                },
                keepalive: true
            });
            fetch(logoutCloud, {
                method: 'POST',
                headers: {
                    'Authorization': `${cloudToken}`
                },
                keepalive: true
            });
            clearAllSessionStorage();
        }
    }, []);
    return { isLoadingLogin, login, logout, logoutOnBrowserClose };
};
