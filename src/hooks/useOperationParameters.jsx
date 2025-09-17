import { useState, useEffect, useMemo, useRef } from 'react';
import { useCommandExecution, usePlantDetailSocket } from '../../../hooks/usePlants';
import { processSocketMessage, getMvZeroText } from '../../../utils/plantUtils';
import { COMMANDS, OPERATION_CODES, SOCKET_KEYS } from '../../../utils/constants';

export function useOperationParameters(plant, isOnline, isLoadingStatus) {
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
        if (isLoadingStatus || !isConnected || !isOnline) {
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
    }, [isLoadingStatus, isConnected, isOnline, plant.id, executeMultipleCommands]);

    useEffect(() => {
        const message = lastEvent?.payload?.event?.message;
        if (!message) return;

        const result = processSocketMessage(message, mvZeroValue);
        if (!result) return;

        switch (result.key) {
            case SOCKET_KEYS.FILTRATION:
                setFiltrado(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.FILTRATION]: "success" }));
                if (!message.includes('RER')) sessionStorage.setItem("filtrado", message);
                break;
            case SOCKET_KEYS.BACKWASH:
                setRetrolavado(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.BACKWASH]: "success" }));
                if (!message.includes('RER')) sessionStorage.setItem("retrolavado", message);
                break;
            case SOCKET_KEYS.RINSE:
                setEnjuague(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.RINSE]: "success" }));
                if (!message.includes('RER')) sessionStorage.setItem("enjuague", message);
                break;
            case SOCKET_KEYS.FLOW_ALERT:
                setValorAlertaFlujo(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.FLOW_ALERT]: "success" }));
                if (!message.includes('RER')) sessionStorage.setItem("alertaflujo", message);
                break;
            case SOCKET_KEYS.INSUFFICIENT_FLOW_ALARM:
                setValorAlarmaInsuficiente(result.value);
                setCommandStatus(prev => ({ ...prev, [COMMANDS.INSUFFICIENT_FLOW_ALARM]: "success" }));
                if (!message.includes('RER')) sessionStorage.setItem("alarmainsuficiente", message);
                break;
            default:
                break;
        }
    }, [lastEvent, mvZeroValue]);

    return { parameters: { filtrado, retrolavado, enjuague, valorAlarmaInsuficiente, valorAlertaFlujo, }, commandStatus, mvZeroValue };
}