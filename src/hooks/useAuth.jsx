import { useNavigate } from 'react-router-dom';
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
            sessionStorage.removeItem('listPlants');
            navigate('/');
        }
    };

    return { login, logout };
};
