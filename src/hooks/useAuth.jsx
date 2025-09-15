import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import authApi from '../api/authApi';


/**
* Hook personalizado para gestionar la autenticación del usuario.
* Proporciona un conjunto de funciones para manejar el ciclo de vida de la sesión,
* incluyendo el inicio de sesión, cierre de sesión, renovación de token y
* el manejo del cierre del navegador.
* @returns {AuthHook} Un objeto con las funciones de autenticación.
*/
export const useAuth = () => {
    const navigate = useNavigate();
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
            const { data } = await authApi.login(credentials);
            //Si es exitoso, almacena la siguiente información en variables de session.
            sessionStorage.setItem('token', data.auth);
            sessionStorage.setItem('auth', true)
            sessionStorage.setItem('username', credentials.username);
            sessionStorage.setItem('password', credentials.password);
            //Redirige al dashboard.
            navigate('/dashboard');
        } catch (error) {
            console.error("Fallo al iniciar sesión:", error);
            throw error;
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
        } catch (error) {
            console.error("Fallo al cerrar sesión en el servidor:", error);
        } finally {
            //Elimina información almacenada en variables de session.
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('auth');
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('password');
            sessionStorage.removeItem('listPlants');
            //Redirige a la página de inicio/login
            navigate('/');
        }
    };
    /**
     * Elimina el token cuando se cierra la ventana del navegador.
     */
    const logoutOnBrowserClose = useCallback(() => {
        const logoutUrl = 'https://rastreo.totaltracking.co/api/logout';
        const token = sessionStorage.getItem('token');
        if (token) {
            fetch(logoutUrl, {
                method: 'GET',
                headers: {
                    'authenticate': `${token}`
                },
                keepalive: true
            });
        }
    }, []);
    /**
     * Renueva la información del token.
     */
    const renewToken = async () => {
        try {
            const username = sessionStorage.getItem('username');
            const password = sessionStorage.getItem('password');

            if (!username || !password) {
                throw new Error("No hay credenciales guardadas");
            }
            const { data } = await authApi.login({ username, password });
            sessionStorage.setItem('token', data.auth);
        } catch (error) {
            console.error("Error renovando token:", error);
            logout();
        }
    };

    return { login, logout, renewToken, logoutOnBrowserClose };
};
