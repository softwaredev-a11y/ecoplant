import { useContext, useEffect, useState, useCallback } from "react";
import { PlantContext } from "@/context/PlantContext";
import { PlantDetailSocketContext } from "@/context/PlantDetailSocketContext";
import plants from '@/services/plants.service'

/**
 * Hook personalizado para acceder a la información de las plantas desde `PlantContext`.
 * Proporciona la lista de plantas y el estado de carga.
 * @returns {{plants: Array<object>, isLoading: boolean}} El contexto de las plantas.
 * @throws {Error} Si se utiliza fuera de un `PlantProvider`.
 */
export const usePlants = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error("usePlants debe usarse dentro de un PlantProvider");
  }
  return context;
};

/**
 * Hook personalizado para acceder a los datos del WebSocket para una planta específica.
 * Proporciona el último evento recibido y el estado de la conexión del socket.
 * @returns {{lastEvent: object|null, isConnected: boolean}} El contexto del socket de detalles de la planta.
 * @throws {Error} Si se utiliza fuera de un `PlantDetailSocketProvider`.
 */
export const usePlantDetailSocket = () => {
  const context = useContext(PlantDetailSocketContext);
  if (!context) {
    throw new Error("usePlants debe usarse dentro de un PlantProvider");
  }
  return context;
};

/**
 * Hook personalizado para obtener el estado de conexión de un dispositivo.
 * @param {string | undefined | null} imei - El IMEI del dispositivo a consultar.
 * @returns {{infoConnectionDevice: object|null, loading: boolean, error: string|null}} Objeto con la información de conexión, estado de carga y error.
 */
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

/**
 * Hook personalizado para manejar la ejecución de comandos en un dispositivo.
 * @returns {{
 *   isLoading: boolean,
 *   executedCids: Array<string>,
 *   error: string|null,
 *   executeMultipleCommands: (idDevice: number, commands: Array<string>) => Promise<Array<string>>
 * }} Objeto con el estado de carga, los CIDs de los comandos ejecutados, error y la función para ejecutar comandos.
 */
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

/**
 * Hook personalizado para consultar datos crudos (raw data) de una planta.
 * @returns {{
 *   isLoading: boolean,
 *   rawData: object|Array,
 *   error: string|null,
 *   rawDataConsult: (startDate: string, endDate: string, idPlant: number, command: number) => Promise<object|Array>
 * }} Objeto con el estado de carga, los datos crudos, error y la función para consultar.
 */
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