import { useState, useCallback } from 'react';
import { useRawDataConsult } from '@/hooks/usePlants';
import { thousandsSeparator, calculateAccumulatedValueFiltration, calculateAccumulatedValueRinse, calculateAccumulatedValueBackwash, gpmToCubicMetersPerMinute } from "@/utils/plantUtils";
import { OPERATION_CODES } from '@/utils/constants';

export const useAccumulatedData = () => {
    const { rawDataConsult, isLoading: isFetchingRawData } = useRawDataConsult();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAndCalculateData = useCallback(async (idPlant, mvZeroValue, beginDate, endDate) => {
        setIsLoading(true);
        setError(null);
        setData(null);

        try {
            const allCodes = [
                OPERATION_CODES.FILTRATION,
                OPERATION_CODES.BACKWASH,
                OPERATION_CODES.RINSE
            ];

            const result = await rawDataConsult(beginDate, endDate, idPlant, allCodes);

            if (!result?.data?.events || result.data.events.length === 0) {
                const noData = {
                    filtration: "Información no disponible",
                    rinse: "Información no disponible",
                    backwash: "Información no disponible",
                    purge: "Información no disponible",
                };
                setData(noData);
                return;
            }

            // Buscamos cada evento por su código, convirtiendo el `e.code` a String para evitar errores de tipo (e.g. 65 vs "65")
            const filtrationEvent = result.data.events.find(e => String(e.code) === OPERATION_CODES.FILTRATION);
            const backwashEvent = result.data.events.find(e => String(e.code) === OPERATION_CODES.BACKWASH);
            const rinseEvent = result.data.events.find(e => String(e.code) === OPERATION_CODES.RINSE);

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
                backwash: `${thousandsSeparator(Math.round(backwashValue))} `,
                purge: `${thousandsSeparator(Math.round(totalPurge))} gal-${multiplyPurge.toFixed(2)} m³/min`
            });

        } catch (err) {
            console.error("Error al calcular datos acumulados:", err);
            setError("Error al calcular los datos.");
            setData({ filtration: "Problemas de comunicación. Intente más tarde.", rinse: "Problemas de comunicación. Intente más tarde.", backwash: "Problemas de comunicación. Intente más tarde.", purge: "Problemas de comunicación. Intente más tarde." });
        } finally {
            setIsLoading(false);
        }
    }, [rawDataConsult]);

    const combinedIsLoading = isLoading || isFetchingRawData;

    return { data, isLoading: combinedIsLoading, error, fetchAndCalculateData };
};
