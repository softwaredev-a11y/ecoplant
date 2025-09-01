// src/hooks/usePlants.js
import { useContext } from "react";
import { PlantContext } from "../context/PlantContext";

export const usePlants = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error("usePlants debe usarse dentro de un PlantProvider");
  }
  return context;
};
