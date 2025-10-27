import { useState, useCallback } from 'react';
import { useRawDataConsult } from '@/hooks/usePlants';
import { calculateAccumulatedValueFiltration, calculateAccumulatedValueRinse, calculateAccumulatedValueInvWTime, gpmToCubicMetersPerMinute } from "@/utils/syrus";
import { thousandsSeparator } from '@/utils/string';
import { OPERATION_CODES, UI_MESSAGES, UNITS_MEASUREMENT } from '@/constants/constants'
import { log } from "@/services/logging.service";

/**
* Hook personalizado para gestionar la consulta de valores acumulados de la Ecoplanta.
* Realiza una solicitud a la API, y obtiene los valores relacionados a filtración, retrolavado,
* enjuague y purgado, en un periodo determinado de tiempo (mes actual o pasado). Posteriormente realiza el cálculo
* y conversión de estos para mostrarlos al usuario.
* @returns {{ data: object|null,  isLoading: boolean, combinedIsLoading: boolean,  error: string|null,  fetchAndCalculateData: function}} Un objecto con los valores acumulados correspondientes a filtración, retrolavado, enjuague y purgado.
*/
export const useAccumulatedData = () => {
    const { rawDataConsult, isLoading: isFetchingRawData } = useRawDataConsult();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    /**
     * Realiza la consulta a la API para obtener la información de los acumulados
     * 
     * @param {number} idPlant - ID de la planta de la cual se va a realizar la consulta.
     * @param {string} mvZeroValue - Valor mv zero que viene en la información de la descripción de la planta.
     * @param {string} beginDate - Fecha de inicio para la consulta (Formato: YYYY-MM-DD).
     * @param {string} endDate - Fecha final para la consulta (Formato: YYYY-MM-DD).
     * 
     * @returns {promise} - Una promesa que se resuelve cuando el proceso ha finalizado.
     */
    const fetchAndCalculateData = useCallback(async (idPlant, mvZeroValue, beginDate, endDate) => {
        setIsLoading(true);
        setError(null);
        setData(null);

        try {
            //Los códigos correspondientes a las operaciones que se van a consultar.
            const operationCodes = [OPERATION_CODES.FILTRATION, OPERATION_CODES.INVW_TIME, OPERATION_CODES.RINSE];
            //Se realiza la consulta y se obtiene la promesa.
            const result = await rawDataConsult(beginDate, endDate, idPlant, operationCodes);
            //Si no obtuvo respuesta es porque hubo problemas en la comunicación.
            if (!result?.data?.events || result.data.events.length === 0) {
                const noData = {
                    filtration: UI_MESSAGES.DATA_NOT_FOUND, rinse: UI_MESSAGES.DATA_NOT_FOUND,
                    invwTime: UI_MESSAGES.DATA_NOT_FOUND, purge: UI_MESSAGES.DATA_NOT_FOUND
                };
                setData(noData);
                return;
            }

            // Buscamos cada evento por su código, convirtiendo el `e.code` a String para evitar errores de tipo (e.g. 65 vs "65")
            const filtrationEvent = result.data.events.find(e => String(e.code) === OPERATION_CODES.FILTRATION);
            const invwTimeEvent = result.data.events.find(e => String(e.code) === OPERATION_CODES.INVW_TIME);
            const rinseEvent = result.data.events.find(e => String(e.code) === OPERATION_CODES.RINSE);
            // Si no existe el evento de filtración, no se puede realizar ningún cálculo por eso lanza error.
            if (!filtrationEvent) {
                throw new Error("Datos de filtración no encontrados para calcular el caudal.");
            }

            const adcAverage = parseFloat(filtrationEvent.promedio_adc);
            const mvZero = parseFloat(mvZeroValue);

            if (isNaN(adcAverage) || isNaN(mvZero)) {
                throw new Error(`Valores para cálculo de caudal inválidos. adc_average: ${adcAverage}, mvZero: ${mvZero}`);
            }

            const caudal = (adcAverage - mvZero) / 100;

            // Calcular valores
            const countFiltrado = filtrationEvent.count || 0;
            const filtrationValue = calculateAccumulatedValueFiltration(caudal, countFiltrado);

            const countEnjuague = rinseEvent?.count || 0;
            const rinseValue = calculateAccumulatedValueRinse(caudal, countEnjuague);

            const countRetrolavado = invwTimeEvent?.count || 0;
            const invwTimeValue = calculateAccumulatedValueInvWTime(caudal, countRetrolavado);

            const totalPurge = rinseValue + invwTimeValue;
            const multiplyPurge = gpmToCubicMetersPerMinute(totalPurge);

            setData({
                filtration: isNaN(filtrationValue) ? UI_MESSAGES.INFORMATION_NOT_AVAILABLE : ` ${thousandsSeparator(Math.round(filtrationValue))} ${UNITS_MEASUREMENT.GALLONS}`,
                rinse: isNaN(rinseValue) ? UI_MESSAGES.INFORMATION_NOT_AVAILABLE : `${thousandsSeparator(Math.round(rinseValue))} ${UNITS_MEASUREMENT.GALLONS}`,
                invwTime: isNaN(invwTimeValue) ? UI_MESSAGES.INFORMATION_NOT_AVAILABLE : `${thousandsSeparator(Math.round(invwTimeValue))} ${UNITS_MEASUREMENT.GALLONS}`,
                purge: isNaN(totalPurge) ? UI_MESSAGES.INFORMATION_NOT_AVAILABLE : `${thousandsSeparator(Math.round(totalPurge))} ${UNITS_MEASUREMENT.GALLONS} (${multiplyPurge.toFixed(2)}  ${UNITS_MEASUREMENT.CUBIC_METERS})`
            });

        } catch (err) {
            setError("Error al calcular los datos acumulados.");
            await log('CALCULATE_ACCUMULATED_ERROR', { idPlant, message: err?.message || err });
            setData({ filtration: UI_MESSAGES.ERROR_OCCURRED, rinse: UI_MESSAGES.ERROR_OCCURRED, invwTime: UI_MESSAGES.ERROR_OCCURRED, purge: UI_MESSAGES.ERROR_OCCURRED });
        } finally {
            setIsLoading(false);
        }
    }, [rawDataConsult]);

    const combinedIsLoading = isLoading || isFetchingRawData;

    return { data, isLoading: combinedIsLoading, error, fetchAndCalculateData };
};
