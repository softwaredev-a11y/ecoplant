import { useNavigate } from 'react-router-dom';
import { useCallback, useState } from 'react';
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
            // Construye la URL de forma dinámica para que funcione en desarrollo y producción.
            // En producción, BASE_URL será '/apps/ecoplant/'.
            const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
            const apiUrl = `${baseUrl}api/cloud_login.php`.replace('//', '/');
            const responseCloud = await fetch(apiUrl, { method: 'POST' });
            if (!responseCloud.ok) {
                throw new Error(`El proxy de Cloud falló con estado: ${responseCloud.status}`);
            }
            const cloudData = await responseCloud.json();
            //Si es exitoso, almacena la siguiente información en variables de session.
            sessionStorage.setItem('token', data.auth);
            sessionStorage.setItem('auth', true)
            sessionStorage.setItem("cloudToken", cloudData?.token);
            sessionStorage.setItem("admToken", cloudData?.token_pegasus);
            //Redirige al dashboard.
            navigate('/dashboard');
        } catch (error) {
            console.error("Fallo al iniciar sesión:", error);
            await authApi.logout();
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
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('cloudToken');
            sessionStorage.removeItem('auth');
            sessionStorage.removeItem('listPlants');
            sessionStorage.removeItem("admToken");
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
        const token = sessionStorage.getItem('token');
        const cloudToken = sessionStorage.getItem('cloudToken');
        if (token) {
            fetch(logoutUrl, {
                method: 'GET',
                headers: {
                    'authenticate': `${token}`
                },
                keepalive: true
            });
            fetch(cloudToken, {
                method: 'POST',
                headers: {
                    'Authentication': `${logoutCloud}`
                },
                keepalive: true
            });
        }
    }, []);
    return { isLoadingLogin, login, logout, logoutOnBrowserClose };
};
