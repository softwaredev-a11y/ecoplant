import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook personalizado para gestionar el ciclo de vida de la sesión del usuario.
 *
 * Este hook implementa varias estrategias para asegurar que la sesión se cierre
 * de forma segura y automática:
 *
 * 1.  **Cierre por Inactividad:** Establece un temporizador de 6 horas. Si la sesión
 *     excede este tiempo, se cierra automáticamente y se redirige al login.
 * 2.  **Cierre de Pestaña/Navegador:** Utiliza los eventos `beforeunload` y `pagehide`
 *     para intentar cerrar la sesión en el servidor y limpiar el token local cuando
 *     el usuario cierra la pestaña o el navegador.
 * 3.  **Visibilidad en Móviles:** El evento `pagehide` también ayuda a manejar casos
 *     en dispositivos móviles donde el navegador puede "ocultar" la pestaña sin cerrarla.
 * 4.  **Verificación Inicial:** Al montarse, comprueba si existe un token. Si no,
 *     redirige inmediatamente a la página de login.
 */
export const useLogout = () => {
    const { logout, logoutOnBrowserClose } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            navigate("/login");
        }

        const MAX_SESSION = 6 * 60 * 60 * 1000;
        const logoutTimer = setTimeout(() => {
            logout();
            navigate("/login");
        }, MAX_SESSION);

        const handleBeforeUnload = () => {
            logoutOnBrowserClose();
        };
        const handlePageHide = () => {
            logoutOnBrowserClose();
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("pagehide", handlePageHide);
        return () => {
            clearTimeout(logoutTimer);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("pagehide", handlePageHide);
        };
    }, [logout, logoutOnBrowserClose, navigate]);
}