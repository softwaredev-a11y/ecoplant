import { useCallback, useState, useRef, useEffect } from "react";
import { SYRUS_FOUR_COMMANDS } from '@/utils/constants';
import plantsApi from '@/services/plants.service';
import axios from "axios";

/**
 * Hook para gestionar la obtención de datos específicos de un dispositivo Syrus 4.
 *
 * @param {object} plant - El objeto de la planta seleccionada, que debe contener la propiedad `device`.
 * @param {boolean} isSyrus4 - Indica si el dispositivo es un Syrus 4.
 * @returns {isSyrus4: booolean, syrus4Data: object|null, isLoading: boolean, error: string, fetchData: function} Un objeto con los datos del Syrus 4, estados de carga/error y la función para iniciar el proceso.
 */
export function useSyrus4Data(plant, isSyrus4) {
    const [syrus4Data, setSyrus4Data] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState();
    const abortControllerRef = useRef(null);

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, [plant, isSyrus4]);

    const fetchData = useCallback(async () => {
        // Cancela cualquier petición anterior que esté en curso
        abortControllerRef.current?.abort();

        if (!isSyrus4) {
            setSyrus4Data(null);
            return;
        }

        // Crea un nuevo AbortController para la petición actual
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const { signal } = controller;

        setIsLoading(true);
        setError(null);
        setSyrus4Data({});

        try {
            const commandsToRun = [
                { name: 'version', command: SYRUS_FOUR_COMMANDS.GET_ECOPLANT_VERSION },
                { name: 'gps', command: SYRUS_FOUR_COMMANDS.GET_ECOPLANT_GPS_STATUS },
                { name: 'params', command: SYRUS_FOUR_COMMANDS.GET_ECOPLANT_PARAMS }
            ];

            const commandPromises = commandsToRun.map(async (cmd) => {
                const sendResponse = await plantsApi.commandExecutionSyrusFour(cmd.command, [plant.device], signal);
                const commandId = sendResponse?.data?.[0]?._id;
                if (!commandId) {
                    return { ...cmd, result: null };
                }
                return { ...cmd, commandId };
            });

            const sentCommands = await Promise.all(commandPromises);

            await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(resolve, 15000);
                signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            });

            for (const cmd of sentCommands) {
                if (signal.aborted) return;
                if (!cmd.commandId) continue;

                const resultResponse = await plantsApi.getResultCommandExecutionSyrusFour(cmd.commandId, signal);

                if (resultResponse.data?.response) {
                    if (cmd.name === 'gps') {
                        const gpsStatus = resultResponse?.data?.response?.antenna?.includes('connected');
                        setSyrus4Data(prev => ({ ...prev, gps: gpsStatus }));
                    } else if (cmd.name === 'version') {
                        setSyrus4Data(prev => ({ ...prev, apps: resultResponse.data.response }));
                    } else if (cmd.name === 'params') {
                        setSyrus4Data(prev => ({ ...prev, params: resultResponse.data.response }));
                    }
                }
            }
        } catch (err) {
            if (axios.isCancel(err) || err.name === 'AbortError') {
                console.log("Petición a Syrus 4 cancelada.");
            } else if (!signal.aborted) {
                console.error("Error al obtener datos de Syrus 4:", err);
                setError(err);
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, [isSyrus4, plant])
    return { isSyrus4, syrus4Data, isLoading, error, fetchData };
}