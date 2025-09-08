import { createContext, useEffect, useState } from "react";
import plantsApi from "../api/plantsApi"; // llamada a la API

export const PlantContext = createContext();

export const PlantProvider = ({ children }) => {
  const [plants, setPlants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getPlants = async () => {
      setIsLoading(true);
      try {
        const cachedPlants = sessionStorage.getItem('listPlants');
        if (cachedPlants) {
          setPlants(JSON.parse(cachedPlants))
        } else {
          const response = await plantsApi.getPlants();
          setPlants(response.data.data);
          sessionStorage.setItem('listPlants', JSON.stringify(response.data.data));
        }
      } catch (error) {
        console.error("Error cargando plantas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getPlants();
  }, []);

  return (
    <PlantContext.Provider value={{ plants, isLoading }}>
      {children}
    </PlantContext.Provider>
  );
};
