import { useState } from "react";
import { useRawDataConsult } from '@/hooks/usePlants';
import { buildDate, thousandsSeparator, calculateAccumulatedValueFiltration, calculateAccumulatedValueRinse, calculateAccumulatedValueBackwash } from "@/utils/plantUtils";
import { useUsers } from "@/hooks/useUsers";
import { OPERATION_CODES } from '../../../utils/constants';

/**
 * Componente que muestra los valores acumulados de operación para el mes anterior.
 * Permite a los superusuarios consultar bajo demanda los datos de filtración, retrolavado y enjuague.
 * @param {object} props - Las propiedades del componente.
 * @param {string|number} props.idPlant - ID de la planta a consultar.
 * @param {string|null} props.mvZeroValue - Valor 'mv_zero' de la planta, usado para cálculos de caudal.
 * @param {boolean} props.isOnline - Indica si la planta está conectada.
 * @returns {JSX.Element | null} El panel con los datos acumulados del mes anterior, o `null` si el usuario no es superusuario.
 */
export default function LastMonthAccumulatedPanel({ idPlant, mvZeroValue, isOnline }) {
    //Hook personalizado para obtener los acumulados
    const { rawDataConsult } = useRawDataConsult();
    const [loadingType, setLoadingType] = useState(null);

    const [filtracionAnterior, setFiltracionAnterior] = useState("");
    const [enjuagueAnterior, setEnjuagueAnterior] = useState("");
    const [retrolavadoAnterior, setRetrolavadoAnterior] = useState("");
    const { isSuperUser } = useUsers();

    const isButtonDisabled = loadingType !== null || !isSuperUser;

    /**
     * Consulta y calcula el valor acumulado para una operación específica del mes anterior.
     * @param {number} code - El código de operación a consultar (filtración, enjuague, etc.).
     * @param {function(string): void} setValue - La función para actualizar el estado del valor calculado.
     * @param {string} type - El tipo de operación (ej. "filtracion", "enjuague") para gestionar el estado de carga.
     */
    const handleConsult = async (code, setValue, type) => {
        setLoadingType(type);
        try {
            const date = new Date();
            const year = date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear();
            const month = date.getMonth() === 0 ? 12 : date.getMonth();

            const beginDate = buildDate(year, month, 1);
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = buildDate(year, month, lastDay);

            const [dataFiltrado, data] = await Promise.all([
                rawDataConsult(beginDate, endDate, idPlant, OPERATION_CODES.FILTRATION),
                rawDataConsult(beginDate, endDate, idPlant, code)
            ]);

            if (!dataFiltrado?.data?.events?.[0] || !data?.data?.events?.[0]) {
                setValue("No disponible");
                return;
            }

            const adc_average = dataFiltrado.data.events[0].promedio_adc;
            const caudal = (adc_average - mvZeroValue) / 100;

            const count = data.data.events[0].count;
            let result = 0;

            if (type === "filtracion") {
                result = calculateAccumulatedValueFiltration(caudal, count);
            } else if (type === "enjuague") {
                result = calculateAccumulatedValueRinse(caudal, count);
            } else if (type === "retrolavado") {
                result = calculateAccumulatedValueBackwash(caudal, count);
            }

            setValue(`${thousandsSeparator(Math.round(result))} gal`);
        } catch (error) {
            console.error("Error al consultar los datos del mes anterior:", error);
            setValue("Error");
        } finally {
            setLoadingType(null);
        }
    };

    const dataLastMonth = [
        {
            id: 0,
            item: "Acumulado Filtración mes anterior",
            value: filtracionAnterior,
            onConsult: () => handleConsult(OPERATION_CODES.FILTRATION, setFiltracionAnterior, "filtracion"),
            type: "filtracion",
        },
        {
            id: 1,
            item: "Acumulado Enjuague mes anterior",
            value: enjuagueAnterior,
            onConsult: () => handleConsult(OPERATION_CODES.BACKWASH, setEnjuagueAnterior, "enjuague"),
            type: "enjuague",
        },
        {
            id: 2,
            item: "Acumulado Retrolavado mes anterior",
            value: retrolavadoAnterior,
            onConsult: () => handleConsult(OPERATION_CODES.RINSE, setRetrolavadoAnterior, "retrolavado"),
            type: "retrolavado",
        },
    ];
    return (
        <>
            {isSuperUser && (
                <div className="data-last-month grid grid-cols-2 items-center mb-0.5 gap-1.5 p-0.5 border-b border-b-[#ccc]">
                    {dataLastMonth.map((data) => (
                        <DataLastMonth
                            key={data.id}
                            {...data}
                            isOnline={isOnline}
                            isButtonDisabled={isButtonDisabled}
                            isCurrentlyLoading={loadingType === data.type}
                            isSuperUser={isSuperUser}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

/**
 * Renderiza una fila para un dato acumulado del mes anterior.
 * Muestra el valor si ya fue consultado, o un botón para iniciar la consulta.
 * @param {object} props - Las propiedades del componente.
 * @param {string} props.item - La etiqueta del dato a mostrar (ej. "Acumulado Filtración mes anterior").
 * @param {string} props.value - El valor del dato, si ya ha sido calculado.
 * @param {function(): void} props.onConsult - Función a ejecutar cuando se hace clic en el botón de consulta.
 * @param {boolean} props.isOnline - Indica si la planta está conectada.
 * @param {boolean} props.isButtonDisabled - Indica si el botón de consulta debe estar deshabilitado.
 * @param {boolean} props.isCurrentlyLoading - Indica si este dato específico se está cargando actualmente.
 * @param {boolean} props.isSuperUser - Indica si el usuario actual tiene permisos de superusuario. Esto determina si puede realizar o no la consulta.
 * @returns {JSX.Element} Un fragmento JSX que representa una fila de datos del mes anterior.
 */
function DataLastMonth({ item, value, onConsult, isOnline, isButtonDisabled, isCurrentlyLoading, isSuperUser }) {
    return (
        <>
            <span className={`item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5 ${isSuperUser ? "" : "hidden"}`}>
                {item}:
            </span>
            {value || !isOnline ? (
                <span className="bg-gray-200 rounded-sm align-middle font-semibold text-gray-600 text-sm md:text-base lg:text-base p-0.5">
                    {isOnline && value ? value : "Información no disponible"}
                </span>
            ) : (
                <button onClick={onConsult}
                    disabled={isButtonDisabled}
                    className={`p-0.5 border-0 bg-[#005596] rounded-sm text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide ${isOnline ? '' : 'hidden'} ${isSuperUser ? "" : "hidden"} disabled:cursor-not-allowed`}>
                    {
                        isCurrentlyLoading ? "Consultando" : "Consultar mes anterior"
                    }
                </button>
            )}
        </>
    );
}
