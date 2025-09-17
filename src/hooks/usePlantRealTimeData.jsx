import { getFlowCurrentValue, getCodeCurrentProcess, stateProcess } from '@/utils/plantUtils';
import { useState, useEffect } from 'react';
import { usePlantDetailSocket } from './usePlants';

export function usePlantRealTimeData() {
    const { lastEvent } = usePlantDetailSocket();
    const [currentlyValue, setCurrentlyValue] = useState("");
    const [currentlyProccess, setCurrentlyProccess] = useState("");


    const [begin, setBegin] = useState(null);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const message = lastEvent?.payload?.event?.message;
        if (!message) return;
        if (message.includes("REV")) {
            const processCode = getCodeCurrentProcess(message);
            if (processCode !== null) {
                setCurrentlyProccess(stateProcess(processCode));
            }
            const eventTime = lastEvent?.payload?.event?.timestamp || Date.now();
            setBegin(eventTime);
        }
        if (message.includes("BL=")) {
            setCurrentlyValue(getFlowCurrentValue(message));
        }
    }, [lastEvent]);

    useEffect(() => {
        if (!begin) return;
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - begin) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [begin]);


    return { currentlyProccess, currentlyValue, elapsed, begin };
}
