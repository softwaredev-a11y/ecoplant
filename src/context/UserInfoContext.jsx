import { createContext, useEffect, useState } from "react";
import usersApi from "../api/usersApi";

export const UserContext = createContext();
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState();
    const [isSuperUser, setIsSuperUser] = useState();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const getInfoUser = async () => {
            try {
                setLoading(true);
                const response = await usersApi.getUser();
                const userData = response.data;
                setUser(userData);
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
        <UserContext.Provider value={{ isSuperUser, loading, error }}>
            {children}
        </UserContext.Provider>
    );
}