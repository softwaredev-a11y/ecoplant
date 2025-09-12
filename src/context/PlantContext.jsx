import { createContext, useEffect, useState } from "react";
import plantsApi from "../api/plantsApi";
import { useUsers } from "../hooks/useUsers";

export const PlantContext = createContext();

export const PlantProvider = ({ children }) => {
  const [plants, setPlants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSuperUser, loading: isLoadingUser } = useUsers();

  useEffect(() => {
    if (isLoadingUser) {
      return;
    }
    const getPlants = async () => {
      setIsLoading(true);
      try {
        const params = isSuperUser
          ? { groups: "123" }
          : {};
        const response = await plantsApi.getPlants(params);
        console.log(response.data.data);
        setPlants(response.data.data);
      } catch (error) {
        console.error("Error cargando plantas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getPlants();
  }, [isSuperUser, isLoadingUser]);

  return (
    <PlantContext.Provider value={{ plants, isLoading }}>
      {children}
    </PlantContext.Provider>
  );
};
