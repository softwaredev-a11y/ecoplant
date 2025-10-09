import { useEffect } from "react";
import { buildDate } from "@/utils/syrusUtils";
import { useAccumulatedData } from "@/hooks/useAccumulatedData";
import { SESSION_STORAGE_KEYS_TO_USE } from "@/constants/constants";
import { sendLogToCliq } from "../services/cliq.service";

/**
 * Hook que centraliza la lógica para calcular los valores a mostrar en el panel de Acumulados actuales.
 * @param {object} param Objeto con todas las dependencias necesarias.
 * @param {number} params.idPlant ID de la planta seleccionada. 
 * @param {number || String} mvZeroValue Valor que viene en la descripción de la planta. 
 * @param {boolean} isOnline Valor que determina si la planta se encuentra online.
 * @returns {data: object, isLoading: boolean, fetchAndCalculateData: ()}
 */
export function useCurrentMonthAccumulatedData(idPlant, mvZeroValue, isOnline) {
    //Hook personalizado para calcular los valores acumulados.
    const { data, isLoading, fetchAndCalculateData } = useAccumulatedData();
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        if (isOnline && idPlant) {
            const consult = async () => {
                try {
                    await new Promise((resolve, reject) => {
                        const timeoutId = setTimeout(resolve, 15000);
                        signal.addEventListener('abort', () => {
                            clearTimeout(timeoutId);
                            reject(new DOMException('Aborted', 'AbortError'));
                        });
                    });

                    const isAuth = sessionStorage.getItem(SESSION_STORAGE_KEYS_TO_USE.AUTH);
                    if (isAuth && !signal.aborted) {
                        const date = new Date();
                        const beginDate = buildDate(date.getFullYear(), date.getMonth() + 1, 1);
                        const currentlyDate = buildDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
                        // Llamamos a la función del hook con las fechas correspondientes
                        fetchAndCalculateData(idPlant, mvZeroValue, beginDate, currentlyDate);
                    }
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error("Error en la consulta de acumulados del mes actual:", error);
                        await sendLogToCliq(`Error: No fue posible realizar la consulta de RawData para la Ecoplanta con ID: ${idPlant}.\nOcurrió el siguiente error: ${error?.message}`);
                    }
                }
            };
            consult();
        }
        return () => {
            controller.abort();
        };
    }, [idPlant, mvZeroValue, isOnline, fetchAndCalculateData]);
    return { data, isLoading, fetchAndCalculateData }
}