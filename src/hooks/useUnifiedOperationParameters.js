import { useMemo } from 'react';
import { useOperationParameters } from '@/hooks/useOperationParameters';
import { getEcoplantParams } from '@/utils/syrus4Utils';
import { getMvZeroText } from '@/utils/syrusUtils';
import { COMMANDS, ERROR_MESSAGES } from '@/utils/constants';

/**
 * Hook adaptador que unifica la obtención de parámetros de operación para dispositivos
 * Syrus 4 y modelos inferiores.
 *
 * @param {object} plant - La planta seleccionada.
 * @param {boolean} isOnline - Indica si el dispositivo está online.
 * @param {boolean} isLoadingStatus - Indica si el estado de conexión se está cargando.
 * @param {boolean} isSyrus4 - Indica si es un dispositivo Syrus 4.
 * @param {object} syrus4Data - Los datos obtenidos para Syrus 4.
 * @param {boolean} isLoadingSyrus4 - Indica si los datos de Syrus 4 se están cargando.
 * @returns {{parameters: object, mvZeroValue: string|null}} Un objeto con los parámetros unificados y el valor mvZero.
 */
export function useUnifiedOperationParameters(plant, isOnline, isLoadingStatus, isSyrus4, syrus4Data, isLoadingSyrus4) {
    // 1. Obtener mvZeroValue de forma independiente, ya que es necesario para ambos casos.
    const mvZeroValue = useMemo(() => {
        return plant?.info?.description ? getMvZeroText(plant.info.description) : null;
    }, [plant?.info?.description]);

    // 2. Obtener los datos para dispositivos antiguos. El hook internamente no hará nada si isSyrus4 es true.
    const { parameters: legacyParams, commandStatus: legacyCommandStatus } = useOperationParameters(plant, isOnline, isLoadingStatus, isSyrus4);

    // 3. Crear el objeto de parámetros unificado.
    const unifiedParameters = useMemo(() => {
        if (!isOnline) {
            const unavailableParam = { value: '', status: 'unavailable' };
            return {
                filtracion: unavailableParam, retrolavado: unavailableParam, enjuague: unavailableParam,
                valorAlertaFlujo: unavailableParam, valorAlarmaInsuficiente: unavailableParam,
            };
        }
        if (isSyrus4) {
            const status = isLoadingSyrus4 ? 'loading' : (syrus4Data?.params ? 'success' : 'error');
            const data = status === 'success' ? getEcoplantParams(syrus4Data.params, mvZeroValue) : {};

            const filtracionValue = legacyParams?.filtrado || data?.filtracion || ERROR_MESSAGES.COMMUNICATION_PROBLEMS;
            const retrolavadoValue = legacyParams?.retrolavado || data?.retrolavado || ERROR_MESSAGES.COMMUNICATION_PROBLEMS;
            const enjuagueValue = legacyParams?.enjuague || data?.enjuague || ERROR_MESSAGES.COMMUNICATION_PROBLEMS;
            const alertaValue = legacyParams?.valorAlertaFlujo ? `${legacyParams?.valorAlertaFlujo} gpm` : (data.alerta ? `${data.alerta} gpm` : ERROR_MESSAGES.COMMUNICATION_PROBLEMS);
            const alarmaValue = legacyParams?.valorAlarmaInsuficiente ? `${legacyParams?.valorAlarmaInsuficiente} gpm` : (data.alarma ? `${data.alarma} gpm` : ERROR_MESSAGES.COMMUNICATION_PROBLEMS);
            // Si el estado inicial no es 'success' o 'loading', se re-evalúa.
            // El estado final será 'success' si el objeto 'data' procesado no está vacío,
            // lo que indica que al menos un parámetro se pudo obtener. De lo contrario, es 'error'.
            const finalStatus = (status === 'loading' || status === 'success') ? status : (Object.keys(data).length > 0 ? status : 'error');

            return {
                filtracion: { value: filtracionValue, status: finalStatus },
                retrolavado: { value: retrolavadoValue, status: finalStatus },
                enjuague: { value: enjuagueValue, status: finalStatus },
                valorAlertaFlujo: { value: alertaValue, status: finalStatus },
                valorAlarmaInsuficiente: { value: alarmaValue, status: finalStatus },
            };
        } else {
            return {
                filtracion: { value: legacyParams?.filtrado, status: legacyCommandStatus[COMMANDS.FILTRATION] || 'loading' },
                retrolavado: { value: legacyParams?.retrolavado, status: legacyCommandStatus[COMMANDS.INVW_TIME] || 'loading' },
                enjuague: { value: legacyParams?.enjuague, status: legacyCommandStatus[COMMANDS.RINSE] || 'loading' },
                valorAlertaFlujo: { value: legacyParams?.valorAlertaFlujo ? `${legacyParams.valorAlertaFlujo} gpm` : '', status: legacyCommandStatus[COMMANDS.FLOW_ALERT] || 'loading' },
                valorAlarmaInsuficiente: { value: legacyParams?.valorAlarmaInsuficiente ? `${legacyParams.valorAlarmaInsuficiente} gpm` : '', status: legacyCommandStatus[COMMANDS.INSUFFICIENT_FLOW_ALARM] || 'loading' },
            };
        }
    }, [isSyrus4, isOnline, isLoadingSyrus4, syrus4Data, legacyParams, legacyCommandStatus, mvZeroValue]);

    return { parameters: unifiedParameters, mvZeroValue };
}