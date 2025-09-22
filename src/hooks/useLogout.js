import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

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
            sessionStorage.removeItem("token");
        };
        const handlePageHide = () => {
            logoutOnBrowserClose();
            sessionStorage.removeItem("token");
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