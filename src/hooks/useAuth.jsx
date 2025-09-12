import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import authApi from '../api/authApi';


/**
 * Hook personalizado para gestionar la autenticación.
 * Proporciona funciones para iniciar y cerrar sesión.
 */
export const useAuth = () => {
    const navigate = useNavigate();
    /**
     * Inicia sesión de un usuario.
     * @param {object} credentials - Credenciales del usuario (email, password).
     */
    const login = async (credentials) => {
        try {
            const { data } = await authApi.login(credentials);
            sessionStorage.setItem('token', data.auth);
            sessionStorage.setItem('auth', true)
            sessionStorage.setItem('username', credentials.username);
            sessionStorage.setItem('password', credentials.password);
            navigate('/dashboard');
        } catch (error) {
            console.error("Fallo al iniciar sesión:", error);
            throw error;
        }
    };
    /**
     * Cierra la sesión del usuario actual.
     */
    const logout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error("Fallo al cerrar sesión en el servidor:", error);
        } finally {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('auth');
            navigate('/');
        }
    };

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

    const renewToken = async () => {
        try {
            const username = sessionStorage.getItem('username');
            const password = sessionStorage.getItem('password');

            if (!username || !password) {
                throw new Error("No hay credenciales guardadas");
            }
            const { data } = await authApi.login({ username, password});
            sessionStorage.setItem('token', data.auth);
        } catch (error) {
            console.error("Error renovando token:", error);
            logout();
        }
    };

    return { login, logout, renewToken, logoutOnBrowserClose };
};
