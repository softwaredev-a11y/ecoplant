import { useContext } from "react";
import { UserContext } from "../context/UserInfoContext";

/**
 * Hook personalizado para acceder a la información del usuario desde `UserContext`.
 * Proporciona el estado de carga, errores y si el usuario es un superusuario.
 *
 * @throws {Error} Si se utiliza fuera de un `UserProvider`.
 * @returns {{isSuperUser: boolean|undefined, loading: boolean, error: object|null}} El contexto del usuario.
 */
export const useUsers = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUsers debe usarse dentro de un UserProvider");
    }
    return context;
}
