// src/hooks/usePlants.js
import { useContext, useEffect, useState, useCallback } from "react";
import { PlantContext } from "../context/PlantContext";
import { PlantDetailSocketContext } from "../context/PlantDetailSocketContext";
import plants from '../api/plantsApi'

export const usePlants = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error("usePlants debe usarse dentro de un PlantProvider");
  }
  return context;
};

export const usePlantDetailSocket = () => {
  const context = useContext(PlantDetailSocketContext);
  if (!context) {
    throw new Error("usePlants debe usarse dentro de un PlantProvider");
  }
  return context;
};

export const useConnectionStatus = (imei) => {
  const [infoConnectionDevice, setInfoConnectionDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!imei) {
      setLoading(false);
      return;
    }
    const fetchStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await plants.getConectionStatus(imei);
        setInfoConnectionDevice(response.data);
      } catch (err) {
        setError("Error al obtener el estado de conexión...");
        setInfoConnectionDevice(null);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [imei]);
  return { infoConnectionDevice, loading, error };
};

export const useCommandExecution = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [executedCids, setExecutedCids] = useState([]);
  const [error, setError] = useState(null);
  const executeMultipleCommands = useCallback(async (idDevice, commands) => {
    try {
      setIsLoading(true);
      setError(null);
      const cids = [];

      for (let i = 0; i < commands.length; i++) {
        const response = await plants.commandExecution(idDevice, commands[i]);
        if (response?.data?.cid) cids.push(response.data.cid);
        if (i < commands.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      setExecutedCids(cids);
      return cids;
    } catch (err) {
      setError("Error al ejecutar los comandos.");
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  return { isLoading, executedCids, error, executeMultipleCommands };
};

export const useRawDataConsult = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [rawData, setRawData] = useState([]);
  const [error, setError] = useState(null);

  const rawDataConsult = useCallback(async (startDate, endDate, idPlant, command) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await plants.getRawData(startDate, endDate, idPlant, command);
      setRawData(response);
      return response;
    } catch (error) {
      setError('Error al consultar el RawData.');
      console.error(error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, rawData, error, rawDataConsult };
};