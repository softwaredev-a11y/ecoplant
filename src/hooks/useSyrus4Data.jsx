import { useCallback, useState, useRef } from "react";
import { SYRUS_FOUR_COMMANDS } from '@/utils/constants';
import plantsApi from '../services/plants.service';


/**
 * Hook para gestionar la obtención de datos específicos de un dispositivo Syrus 4.
 *
 * @param {object} plant - El objeto de la planta seleccionada, que debe contener la propiedad `device`.
 * @param {boolean} isSyrus4 - Indica si el dispositivo es un Syrus 4.
 * @returns {object} Un objeto con los datos del Syrus 4, estados de carga/error y la función para iniciar el proceso.
 */
export function useSyrus4Data(plant, isSyrus4) {
    const [syrus4Data, setSyrus4Data] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState();
    const hasExecutedSyrusLogic = useRef(false);


    const fetchData = useCallback(async () => {
        if (!isSyrus4) {
            setSyrus4Data(null);
            return;
        }
        setIsLoading(true);
        setError(null);
        hasExecutedSyrusLogic.current = true;

        try {
            const commandsToRun = [
                { name: 'version', command: SYRUS_FOUR_COMMANDS.GET_ECOPLANT_VERSION },
                { name: 'gps', command: SYRUS_FOUR_COMMANDS.GET_ECOPLANT_GPS_STATUS },
                { name: 'params', command: SYRUS_FOUR_COMMANDS.GET_ECOPLANT_PARAMS }
            ];

            const commandPromises = commandsToRun.map(async (cmd) => {
                const sendResponse = await plantsApi.commandExecutionSyrusFour(cmd.command, [plant.device]);
                const commandId = sendResponse?.data?.[0]?._id;
                if (!commandId) {
                    console.error(`No se recibió ID para el comando: ${cmd.command}`);
                    return { ...cmd, result: null };
                }
                console.log(`Comando '${cmd.name}' enviado con ID: ${commandId}`);
                return { ...cmd, commandId };
            });

            const sentCommands = await Promise.all(commandPromises);

            console.log("Esperando 15 segundos para que los dispositivos procesen...");
            await new Promise(resolve => setTimeout(resolve, 15000));

            for (const cmd of sentCommands) {
                if (!cmd.commandId) continue;

                console.log(`Consultando resultado para el comando '${cmd.name}' (ID: ${cmd.commandId})`);
                const resultResponse = await plantsApi.getResultCommandExecutionSyrusFour(cmd.commandId);
                console.log(`Respuesta para '${cmd.name}':`, resultResponse.data);

                if (resultResponse.data?.response) {
                    if (cmd.name === 'gps') {
                        const gpsStatus = resultResponse.data.response.antenna?.includes('connected');
                        setSyrus4Data(prev => ({ ...prev, gps: gpsStatus }));
                    } else if (cmd.name === 'version') {
                        setSyrus4Data(prev => ({ ...prev, apps: resultResponse.data.response }));
                    } else if (cmd.name === 'params') {
                        setSyrus4Data(prev => ({ ...prev, params: resultResponse.data.response }));
                    }
                }
            }
        } catch (error) {
            console.error("Error al obtener datos de Syrus 4:", error);
            setError(error);
        } finally {
            setIsLoading(false);
        }
    }, [isSyrus4, plant])
    return { isSyrus4, syrus4Data, isLoading, error, fetchData };
}