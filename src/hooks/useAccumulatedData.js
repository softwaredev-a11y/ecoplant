import { useState, useCallback } from 'react';
import { useRawDataConsult } from '@/hooks/usePlants';
import { thousandsSeparator, calculateAccumulatedValueFiltration, calculateAccumulatedValueRinse, calculateAccumulatedValueBackwash, gpmToCubicMetersPerMinute } from "@/utils/plantUtils";
import { OPERATION_CODES, ERROR_MESSAGES } from '@/utils/constants';

/**
* Hook personalizado para gestionar la consulta de valores acumulados de la Ecoplanta.
* Realiza una solicitud a la API, y obtiene los valores relacionados a filtración, retrolavado y
* enjuague, en un periodo determinado de tiempo (mes actual o pasado). Posteriormente realiza el cálculo
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
            const operationCodes = [
                OPERATION_CODES.FILTRATION,
                OPERATION_CODES.BACKWASH,
                OPERATION_CODES.RINSE
            ];
            //Se realiza la consulta y se obtiene la promesa.
            const result = await rawDataConsult(beginDate, endDate, idPlant, operationCodes);
            //Si no obtuvo respuesta es porque hubo problemas en la comunicación.
            if (!result?.data?.events || result.data.events.length === 0) {
                const noData = {
                    filtration: ERROR_MESSAGES.COMMUNICATION_PROBLEMS,
                    rinse: ERROR_MESSAGES.COMMUNICATION_PROBLEMS,
                    backwash: ERROR_MESSAGES.COMMUNICATION_PROBLEMS,
                    purge: ERROR_MESSAGES.COMMUNICATION_PROBLEMS,
                };
                setData(noData);
                return;
            }

            // Buscamos cada evento por su código, convirtiendo el `e.code` a String para evitar errores de tipo (e.g. 65 vs "65")
            const filtrationEvent = result.data.events.find(e => String(e.code) === OPERATION_CODES.FILTRATION);
            const backwashEvent = result.data.events.find(e => String(e.code) === OPERATION_CODES.BACKWASH);
            const rinseEvent = result.data.events.find(e => String(e.code) === OPERATION_CODES.RINSE);
            // Si no existe el evento de filtración, no se puede realizar ningún cálculo por eso lanza error.
            if (!filtrationEvent) {
                throw new Error("Datos de filtración no encontrados para calcular el caudal.");
            }

            const adc_average = parseFloat(filtrationEvent.promedio_adc);
            const caudal = (adc_average - parseFloat(mvZeroValue)) / 100;

            // Calcular valores
            const countFiltrado = filtrationEvent.count || 0;
            const filtrationValue = calculateAccumulatedValueFiltration(caudal, countFiltrado);

            const countEnjuague = rinseEvent?.count || 0;
            const rinseValue = calculateAccumulatedValueRinse(caudal, countEnjuague);

            const countRetrolavado = backwashEvent?.count || 0;
            const backwashValue = calculateAccumulatedValueBackwash(caudal, countRetrolavado);

            const totalPurge = rinseValue + backwashValue;
            const multiplyPurge = gpmToCubicMetersPerMinute(totalPurge);

            setData({
                filtration: `${thousandsSeparator(Math.round(filtrationValue))} gal`,
                rinse: `${thousandsSeparator(Math.round(rinseValue))} gal`,
                backwash: `${thousandsSeparator(Math.round(backwashValue))} gal`,
                purge: `${thousandsSeparator(Math.round(totalPurge))} gal (${multiplyPurge.toFixed(2)} m³/min)`
            });

        } catch (err) {
            console.error("Error al calcular datos acumulados:", err);
            setError("Error al calcular los datos acumulados.");
            setData({ filtration: "Ocurrió un error. Intente más tarde.", rinse: "Ocurrió un error. Intente más tarde.", backwash: "Ocurrió un error. Intente más tarde.", purge: "Ocurrió un error. Intente más tarde." });
        } finally {
            setIsLoading(false);
        }
    }, [rawDataConsult]);

    const combinedIsLoading = isLoading || isFetchingRawData;

    return { data, isLoading: combinedIsLoading, error, fetchAndCalculateData };
};
