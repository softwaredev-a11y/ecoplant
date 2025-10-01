import { useState, useEffect, useMemo, useRef } from 'react';
import { useCommandExecution, usePlantDetailSocket } from '@/hooks/usePlants';
import { processSocketMessage, getMvZeroText } from '@/utils/plantUtils';
import { COMMANDS, SOCKET_KEYS, HEADER_MESSAGES_SOCKET } from '@/utils/constants';
import { proccessSyrus4SocketMessage } from '@/utils/syrus4Utils';

/**
 * Hook para gestionar los parámetros de operación.
 *
 * Envía comandos de tipo query (QED) a dispositivos inferiores a syrus 4 al conectar, gestiona las respuestas que llegan vía WebSocket. 
 * Maneja un sistema de reintentos para asegurar la obtención de los datos en el caso de dispositivos inferiores a syrus 4.
 * @param {object} plant - La planta seleccionada.
 * @param {boolean} isOnline - Indica si el dispositivo está online.
 * @param {boolean} isLoadingStatus - Indica si la información de conexión aún se está cargando.
 * @param {boolean} isSyrus4 - Indica si la planta es un Syrus 4, en cuyo caso, no se ejecutan los comandos de tipo QED.
 * @returns {{parameters: object|null, commandStatus: string|null, mvZeroValue: string|null}} Un objeto con los parámetros, el estado de los comandos y el valor mvZero.
 */
export function useOperationParameters(plant, isOnline, isLoadingStatus, isSyrus4) {
    const { executeMultipleCommands } = useCommandExecution();
    const { lastEvent, isConnected } = usePlantDetailSocket();

    const [filtrado, setFiltrado] = useState("");
    const [retrolavado, setRetrolavado] = useState("");
    const [enjuague, setEnjuague] = useState("");
    const [valorAlarmaInsuficiente, setValorAlarmaInsuficiente] = useState("");
    const [valorAlertaFlujo, setValorAlertaFlujo] = useState("");

    const [commandStatus, setCommandStatus] = useState({});

    const mvZeroValue = useMemo(() => {
        if (plant?.info?.description) {
            return getMvZeroText(plant.info.description);
        }
        return null;
    }, [plant?.info?.description]);

    const hasRunRef = useRef(false);

    useEffect(() => {
        if (isLoadingStatus || !isConnected || !isOnline || isSyrus4) {
            hasRunRef.current = false;
            return;
        }
        if (hasRunRef.current) return;
        hasRunRef.current = true;
        const commands = Object.values(COMMANDS);
        setCommandStatus(Object.fromEntries(commands.map(c => [c, "loading"])));
        executeMultipleCommands(plant.id, commands);
        const firstTimeout = setTimeout(() => {
            commands.forEach(cmd => {
                setCommandStatus(prev => {
                    if (prev[cmd] === "loading") {
                        executeMultipleCommands(plant.id, [cmd]);
                    }
                    return prev;
                });
            });
        }, 20000);
        const secondTimeout = setTimeout(() => {
            setCommandStatus(prev =>
                Object.fromEntries(
                    commands.map(cmd => [
                        cmd,
                        prev[cmd] === "loading" ? "error" : prev[cmd],
                    ])
                )
            );
        }, 30000);

        return () => {
            clearTimeout(firstTimeout);
            clearTimeout(secondTimeout);
        };
    }, [isLoadingStatus, isConnected, isOnline, plant.id, isSyrus4, executeMultipleCommands]);

    useEffect(() => {
        const message = lastEvent?.payload?.event?.message;
        if (!message) return;
        const result = isSyrus4 ? proccessSyrus4SocketMessage(message, mvZeroValue) : processSocketMessage(message, mvZeroValue);
        if (!result) return;

        switch (result.key) {
            case SOCKET_KEYS.FILTRATION:
                setFiltrado(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.FILTRATION]: "success" }));
                if (!message.includes(HEADER_MESSAGES_SOCKET.ERROR)) sessionStorage.setItem("filtrado", message);
                break;
            case SOCKET_KEYS.INVW_TIME:
                setRetrolavado(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.INVW_TIME]: "success" }));
                if (!message.includes(HEADER_MESSAGES_SOCKET.ERROR)) sessionStorage.setItem("retrolavado", message);
                break;
            case SOCKET_KEYS.RINSE:
                setEnjuague(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.RINSE]: "success" }));
                if (!message.includes(HEADER_MESSAGES_SOCKET.ERROR)) sessionStorage.setItem("enjuague", message);
                break;
            case SOCKET_KEYS.FLOW_ALERT:
                setValorAlertaFlujo(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.FLOW_ALERT]: "success" }));
                if (!message.includes(HEADER_MESSAGES_SOCKET.ERROR)) sessionStorage.setItem("alertaflujo", message);
                break;
            case SOCKET_KEYS.INSUFFICIENT_FLOW_ALARM:
                setValorAlarmaInsuficiente(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.INSUFFICIENT_FLOW_ALARM]: "success" }));
                if (!message.includes(HEADER_MESSAGES_SOCKET.ERROR)) sessionStorage.setItem("alarmainsuficiente", message);
                break;
            default:
                break;
        }
    }, [lastEvent, mvZeroValue, isSyrus4]);

    return { parameters: { filtrado, retrolavado, enjuague, valorAlarmaInsuficiente, valorAlertaFlujo, }, commandStatus, mvZeroValue };
}