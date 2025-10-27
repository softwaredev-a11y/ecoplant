import { useNavigate } from 'react-router-dom';
import { useCallback, useState } from 'react';
import { clearAllSessionStorage } from "@/utils/syrus"
import { SESSION_STORAGE_KEYS_TO_USE, APP_ROUTES } from '@/constants/constants';
import { log } from "@/services/logging.service";
import authApi from '@/services/auth.service';

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
        try {
            //Envía la información del usuario (email, passowrd)
            setIsLoadingLogin(true);
            const { data } = await authApi.login(credentials);
            const responseCloud = await authApi.cloudLogin();
            const cloudData = responseCloud;
            //Si es exitoso, almacena la siguiente información en variables de session.
            sessionStorage.setItem(SESSION_STORAGE_KEYS_TO_USE.PEGASUS_TOKEN, data.auth);
            sessionStorage.setItem(SESSION_STORAGE_KEYS_TO_USE.AUTH, true)
            sessionStorage.setItem(SESSION_STORAGE_KEYS_TO_USE.CLOUD_TOKEN, cloudData?.token);
            sessionStorage.setItem(SESSION_STORAGE_KEYS_TO_USE.ADM_TOKEN, cloudData?.token_pegasus);
            //Redirige al dashboard.
            navigate(APP_ROUTES.DASHBOARD);
        } catch (error) {
            //Envía el mensaje al canal de cliq informando que un usuario tuvo un error al iniciar sesión.
            await log('LOGIN_ERROR', { user: credentials.username, message: error?.message });
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
            navigate(APP_ROUTES.DASHBOARD.LOGIN);
        }
    };
    /**
     * Elimina el token cuando se cierra la ventana del navegador.
     */
    const logoutOnBrowserClose = useCallback(() => {
        const pegasusToken = sessionStorage.getItem(SESSION_STORAGE_KEYS_TO_USE.PEGASUS_TOKEN);
        const cloudToken = sessionStorage.getItem(SESSION_STORAGE_KEYS_TO_USE.CLOUD_TOKEN);
        if (pegasusToken) {
            authApi.logoutPegasusFetch(pegasusToken);
            authApi.logoutCloudFetch(cloudToken);
        }
    }, []);
    return { isLoadingLogin, login, logout, logoutOnBrowserClose };
};
