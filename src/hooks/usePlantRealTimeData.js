import { getFlowCurrentValue, getCodeCurrentProcess, getOperationByStatusCode } from '@/utils/syrusUtils';
import { HEADER_MESSAGES_SOCKET } from '@/constants/constants'
import { useState, useEffect } from 'react';
import { usePlantDetailSocket } from './usePlants';

/**
 * Hook para obtener y procesar datos de la planta en tiempo real desde el WebSocket.
 *
 * Escucha los eventos del socket para determinar el proceso en ejecución,
 * el flujo actual y calcula el tiempo transcurrido desde el inicio del último proceso.
 * Esta información se muestra en el panel de descripción.
 * @returns {currentlyProccess: string, currentlyValue: number|string, elapsed: number, begin: number} Un objeto con los datos en tiempo real de la planta.
 */
export function usePlantRealTimeData() {
    const { lastEvent } = usePlantDetailSocket();
    const [currentlyValue, setCurrentlyValue] = useState("");
    const [currentlyProccess, setCurrentlyProccess] = useState("");

    const [begin, setBegin] = useState(null);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const message = lastEvent?.payload?.event?.message;
        if (!message) return;
        if (message.includes(HEADER_MESSAGES_SOCKET.GET_CURRENT_PROCCESS)) {
            const processCode = getCodeCurrentProcess(message);
            if (processCode !== null) {
                //Actualiza la información relacionada al proceso que se está ejecutando.
                setCurrentlyProccess(getOperationByStatusCode(processCode));
            }
            const eventTime = lastEvent?.payload?.event?.timestamp || Date.now();
            setBegin(eventTime);
        }

        if (message.includes(HEADER_MESSAGES_SOCKET.GET_CURRENT_FLOW)) {
            //Actualiza la información relacionada al flujo que está corriendo actualmente.
            setCurrentlyValue(getFlowCurrentValue(message));
        }
    }, [lastEvent]);

    //Contador que determina cuando fue la última vez que recibió un evento.
    useEffect(() => {
        if (!begin) return;
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - begin) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [begin]);


    return { currentlyProccess, currentlyValue, elapsed, begin };
}
