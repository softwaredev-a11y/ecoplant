import { createContext, useEffect, useState } from "react";
import usersApi from "@/services/users.service";

export const UserContext = createContext();
/**
 *Componente proveedor que envuelve la aplicación o partes de ella para dar detalles del tipo de usuario.
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
            try {
                const response = await usersApi.getUser();
                const userData = response.data;
                //Se obtiene la información del usuario consultado.
                setUser(userData);
                //Para diferenciar un usuario normal de un superuser, se debe fijar en el apellido.
                //La diferencia entre ambos está en las funcionalidades a las que pueden acceder.
                //Si es normal, solamente puede visualizar información en tiempo real, mientras que si
                //es superuser, puede realizar cambios en parámetros de operación y consultar datos acumulados.
                setIsSuperUser(userData.last_name.includes('superuser'));
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