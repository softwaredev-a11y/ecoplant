import { createContext, useEffect, useState } from "react";
import plantsApi from "../api/plantsApi"; // llamada a la API

export const PlantContext = createContext();

export const PlantProvider = ({ children }) => {  
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    const getPlants = async () => {
      try {
        const response = await plantsApi.getPlants();
        setPlants(response.data.data);
      } catch (error) {
        console.error("Error cargando plantas:", error);
      }
    };

    getPlants();
  }, []);

  return (
    <PlantContext.Provider value={{ plants }}>
      {children}
    </PlantContext.Provider>
  );
};
