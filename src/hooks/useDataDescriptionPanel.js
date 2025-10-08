import { useMemo } from "react";
import { COMMAND_STATES, ERROR_MESSAGES, STATUS } from "../utils/constants"
import { formatEcoplantVersion } from '@/utils/syrus4Utils'
import { getPlantModel, getSoftwareVersion, getOperationByStatusCode, calculateCurrentFlow, isCurrentFlowVisible } from '@/utils/syrusUtils';
import { usePlantRealTimeData } from './usePlantRealTimeData';

/**
 * Hook que centraliza la lógica para calcular los valores a mostrar en el DescriptionPanel.
 * @param {object} params - Objeto con todas las dependencias necesarias.
 * @param {object} params.plant - Objeto con la información de la planta.
 * @param {object} params.infoConnectionDevice - Objeto con el estado de conexión del dispositivo.
 * @param {boolean} params.isSyrus4 - Booleano que determina si el dispositivo es un Syrus 4.
 * @param {object} params.syrus4Data - Objeto con la información de dispositivo Syrus 4.
 * @param {boolean} params.isLoadingSyrus4 - Booleando que determina si la información del dispositivo Syrus 4 se está consultando.
 */
export default function useDataDescriptionPanel({ plant, infoConnectionDevice, isSyrus4, syrus4Data, isLoadingSyrus4 }) {
    //Determina si la planta se encuentra online.
    const { currentlyProccess, currentlyValue, elapsed, begin } = usePlantRealTimeData();

    const isOnline = useMemo(() => {
        return infoConnectionDevice?.connection?.online;
    }, [infoConnectionDevice?.connection?.online])

    //Determina el valor del último flujo registrado
    const lastCurrentFlow = useMemo(() => {
        return infoConnectionDevice?.latest?.data?.ad?.value;
    }, [infoConnectionDevice?.latest?.data?.ad?.value])

    //Determina el código del último evento que se ejecutó en la planta.
    const runningProcessCode = useMemo(() => {
        return infoConnectionDevice?.latest?.loc?.code;
    }, [infoConnectionDevice?.latest?.loc?.code])

    //Determina el modelo de la Ecoplanta
    const ecoplantModel = useMemo(() => {
        return getPlantModel(plant.info.description);
    }, [plant.info.description])

    //Determina la versión del script
    const scriptVersion = useMemo(() => {
        return isOnline
            ? isSyrus4
                ? (isLoadingSyrus4 || !syrus4Data?.apps)
                    ? COMMAND_STATES.CONSULTANDO : formatEcoplantVersion(syrus4Data.apps)
                : getSoftwareVersion(plant.configuration)
            : ERROR_MESSAGES.INFORMATION_NOT_AVAILABLE;
    }, [plant.configuration, isSyrus4, isLoadingSyrus4, syrus4Data?.apps, isOnline]);

    //Determina el estado de la conectividad del celular
    const isMobileOnline = useMemo(() => {
        return isOnline ?
            STATUS.OK : "No Ok (Fuera de línea)"
    }, [isOnline])

    //Determina el estado de la conexión del accesorio expansor
    const expansorState = useMemo(() => {
        return isOnline ?
            infoConnectionDevice?.ios_state?.io_exp_state ?
                STATUS.OK : "No conectado" : ERROR_MESSAGES.INFORMATION_NOT_AVAILABLE;
    }, [isOnline, infoConnectionDevice?.ios_state?.io_exp_state])

    //Determina el estado de la señal del gps.
    const gpsSignalStatus = useMemo(() => {
        if (!isOnline) {
            return ERROR_MESSAGES.INFORMATION_NOT_AVAILABLE
        }
        if (isSyrus4) {
            if (isLoadingSyrus4) {
                return COMMAND_STATES.CONSULTANDO;
            } if (syrus4Data?.gps === undefined) {
                return ERROR_MESSAGES.COMMUNICATION_PROBLEMS
            }
            return syrus4Data.gps ? STATUS.OK : "No óptimo";
        }
        return infoConnectionDevice?.latest?.loc?.valid ? STATUS.OK : "No óptimo";
    }, [isOnline, isSyrus4, syrus4Data?.gps, infoConnectionDevice?.latest?.loc?.valid, isLoadingSyrus4])

    //Genera el texto para el procesos en ejecución
    const processDisplayText = useMemo(() => {
        return isOnline ?
            currentlyProccess || getOperationByStatusCode(runningProcessCode) :
            ERROR_MESSAGES.INFORMATION_NOT_AVAILABLE;
    }, [isOnline, currentlyProccess, runningProcessCode])

    // Determina el texto para "Flujo actual"
    const currentFlowDisplayText = useMemo(() => {
        if (!isOnline) return ERROR_MESSAGES.INFORMATION_NOT_AVAILABLE;
        if (!isCurrentFlowVisible(runningProcessCode)) return "---";
        const flowValue = currentlyValue !== "" ? currentlyValue : calculateCurrentFlow(lastCurrentFlow);
        return `${flowValue} gpm`;
    }, [isOnline, currentlyValue, runningProcessCode, lastCurrentFlow])

    return { data: { isOnline, ecoplantModel, scriptVersion, isMobileOnline, expansorState, gpsSignalStatus, processDisplayText, currentFlowDisplayText }, elapsed, begin }
}