import { useContext } from "react";
import { UserContext } from "../context/UserInfoContext";

export const useUsers = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUsers debe usarse dentro de un PlantProvider");
    }
    return context;
}

