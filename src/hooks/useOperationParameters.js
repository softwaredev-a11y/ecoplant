import { useState, useEffect, useMemo, useRef } from 'react';
import { useCommandExecution, usePlantDetailSocket } from '@/hooks/usePlants';
import { processSocketMessage, getMvZeroText } from '@/utils/syrusUtils';
import { COMMANDS, SOCKET_KEYS, HEADER_MESSAGES_SOCKET, COMMAND_STATES } from '@/utils/constants';
import { proccessSyrus4SocketMessage } from '@/utils/syrus4Utils';
import { isScheduleMessage, extractScheduleMessageHeader, generateOperationHours, getSyrus4OperationHours } from '@/utils/operationHoursUtils';
import { SYRUS3_MESSAGE_HEADERS } from '@/utils/constants';

/**
 * Hook para gestionar los parámetros de operación.
 *
 * Envía comandos de tipo query (QED) a dispositivos inferiores a syrus 4 al conectar, gestiona las respuestas que llegan vía WebSocket. 
 * Maneja un sistema de reintentos para asegurar la obtención de los datos en el caso de dispositivos inferiores a syrus 4.
 * La gestión de respuestas es para todo tipo de dispositivos, S4 e inferiores.
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
    const [horario, setHorario] = useState("");
    const [scheduleParts, setScheduleParts] = useState({});
    const [commandStatus, setCommandStatus] = useState({});

    const mvZeroValue = useMemo(() => {
        if (plant?.info?.description) {
            return getMvZeroText(plant.info.description);
        }
        return null;
    }, [plant?.info?.description]);

    const hasRunRef = useRef(false);
    const isManualChangeRef = useRef(false);

    // Efecto para la carga inicial de parámetros en Syrus 3.
    // Este efecto está diseñado para ejecutarse UNA SOLA VEZ cuando el componente se monta.
    useEffect(() => {
        // Si no se cumplen las condiciones para iniciar, o si ya se ejecutó, no hacemos nada.
        if (isLoadingStatus || !isConnected || !isOnline || isSyrus4) {
            hasRunRef.current = false;
            return;
        }
        //Si se intenta ejecutar cuando solamente es un cambio en algún parámetro de operación,
        //entonces se detiene la ejecución.
        if (isManualChangeRef.current) {
            isManualChangeRef.current = false;
            return;
        }
        if (hasRunRef.current) return;
        hasRunRef.current = true;
        const commands = Object.values(COMMANDS);
        setCommandStatus(Object.fromEntries(commands.map(c => [c, COMMAND_STATES.LOADING])));
        //Ejecuta los comandos que tienen cómo estado de carga: Loading.
        executeMultipleCommands(plant.id, commands);
        const firstTimeout = setTimeout(() => {
            commands.forEach(cmd => {
                setCommandStatus(prev => {
                    if (prev[cmd] === COMMAND_STATES.LOADING) {
                        executeMultipleCommands(plant.id, [cmd]);
                    }
                    return prev;
                });
            });
        }, 25000);
        //Verfica los estados de los comandos después de su ejecución, en caso de que sigan en Loading, los deja como problemas de comunicación.
        const secondTimeout = setTimeout(() => {
            setCommandStatus(prev =>
                Object.fromEntries(
                    commands.map(cmd => [
                        cmd,
                        prev[cmd] === COMMAND_STATES.LOADING ? COMMAND_STATES.ERROR : prev[cmd],
                    ])
                )
            );
        }, 35000);
        return () => {
            clearTimeout(firstTimeout);
            clearTimeout(secondTimeout);
        };
    }, [isLoadingStatus, isConnected, isOnline, plant.id, isSyrus4, executeMultipleCommands]);

    useEffect(() => {
        const message = lastEvent?.payload?.event?.message;
        if (!message) return;
        if (isScheduleMessage(message)) {
            if (!isSyrus4) {
                const header = extractScheduleMessageHeader(message);
                const newParts = { ...scheduleParts, [header]: message };
                setScheduleParts(newParts);
                if (header.includes(SYRUS3_MESSAGE_HEADERS.RES_CMD_QGT001)) setCommandStatus(prev => ({ ...prev, [COMMANDS.TIME_00]: COMMAND_STATES.SUCCESS }));
                if (header.includes(SYRUS3_MESSAGE_HEADERS.RES_CMD_QGT011)) setCommandStatus(prev => ({ ...prev, [COMMANDS.TIME_01]: COMMAND_STATES.SUCCESS }));
                if (header.includes(SYRUS3_MESSAGE_HEADERS.RES_CMD_QGT021)) setCommandStatus(prev => ({ ...prev, [COMMANDS.TIME_02]: COMMAND_STATES.SUCCESS }));
                if (Object.keys(newParts).length === 3) {
                    const finalSchedule = generateOperationHours(newParts);
                    setHorario(finalSchedule);
                    setScheduleParts({});
                }
            } else {
                const finalSchedule = getSyrus4OperationHours(message);
                setHorario(finalSchedule);
            }
            return;
        }
        const result = isSyrus4 ? proccessSyrus4SocketMessage(message, mvZeroValue) : processSocketMessage(message, mvZeroValue);
        if (!result) return;

        switch (result.key) {
            case SOCKET_KEYS.FILTRATION:
                setFiltrado(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.FILTRATION]: COMMAND_STATES.SUCCESS }));
                if (!message.includes(HEADER_MESSAGES_SOCKET.ERROR)) sessionStorage.setItem("filtrado", message);
                break;
            case SOCKET_KEYS.INVW_TIME:
                setRetrolavado(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.INVW_TIME]: COMMAND_STATES.SUCCESS }));
                if (!message.includes(HEADER_MESSAGES_SOCKET.ERROR)) sessionStorage.setItem("retrolavado", message);
                break;
            case SOCKET_KEYS.RINSE:
                setEnjuague(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.RINSE]: COMMAND_STATES.SUCCESS }));
                if (!message.includes(HEADER_MESSAGES_SOCKET.ERROR)) sessionStorage.setItem("enjuague", message);
                break;
            case SOCKET_KEYS.FLOW_ALERT:
                setValorAlertaFlujo(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.FLOW_ALERT]: COMMAND_STATES.SUCCESS }));
                if (!message.includes(HEADER_MESSAGES_SOCKET.ERROR)) sessionStorage.setItem("alertaflujo", message);
                break;
            case SOCKET_KEYS.INSUFFICIENT_FLOW_ALARM:
                setValorAlarmaInsuficiente(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.INSUFFICIENT_FLOW_ALARM]: COMMAND_STATES.SUCCESS }));
                if (!message.includes(HEADER_MESSAGES_SOCKET.ERROR)) sessionStorage.setItem("alarmainsuficiente", message);
                break;
            default:
                break;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastEvent, mvZeroValue, isSyrus4]);

    return { parameters: { filtrado, retrolavado, enjuague, valorAlarmaInsuficiente, valorAlertaFlujo, horario }, commandStatus, mvZeroValue, isManualChangeRef };
}