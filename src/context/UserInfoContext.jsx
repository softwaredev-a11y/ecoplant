import { createContext, useEffect, useState } from "react";
import usersApi from "@/services/users.service";

export const UserContext = createContext();
/**
 *Componente proveedor que envuelve la aplicación o partes de ella para dar detalles del usuario.
 * @param {object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes hijos que tendrán acceso al contexto.
 * @returns {JSX.Element}
 */
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState();
    const [isSuperUser, setIsSuperUser] = useState();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const getInfoUser = async () => {
            // 1. Intentar obtener los datos del usuario desde sessionStorage
            const cachedUserData = sessionStorage.getItem('userData');
            if (cachedUserData) {
                const userData = JSON.parse(cachedUserData);
                setUser(userData);
                setIsSuperUser(userData.last_name.includes('superuser'));
                setLoading(false);
                return; // Si los datos están en caché, no hacemos la llamada a la API
            }
            // 2. Si no hay datos en caché, hacer la llamada a la API
            try {
                const response = await usersApi.getUser();
                const userData = response.data;
                setUser(userData);
                setIsSuperUser(userData.last_name.includes('superuser'));

                // 3. Guardar los datos obtenidos en sessionStorage para futuras cargas
                sessionStorage.setItem('userData', JSON.stringify(userData));

            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        }
        getInfoUser();
    }, [])
    return (
        <UserContext.Provider value={{ user, isSuperUser, loading, error }}>
            {children}
        </UserContext.Provider>
    );
}