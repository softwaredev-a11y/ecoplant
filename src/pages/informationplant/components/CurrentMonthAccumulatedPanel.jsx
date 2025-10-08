import { useCurrentMonthAccumulatedData } from "@/hooks/useCurrentMonthAccumulatedData";
import { UI_MESSAGES } from "@/constants/constants";
import { useMemo } from "react";
/**
 * Componente que muestra los valores acumulados de operación para el mes actual.
 * Obtiene y calcula los datos de filtración, retrolavado, enjuague y purgado.
 * @param {object} props - Las propiedades del componente.
 * @param {number} props.idPlant - ID de la planta a consultar.
 * @param {string} props.mvZeroValue - Valor 'mv_zero' de la planta, usado para cálculos de caudal.
 * @param {boolean} props.isOnline - Indica si la planta está conectada.
 * @returns {JSX.Element} El panel con los datos acumulados del mes actual.
 */
export default function CurrentMonthAccumulatedPanel({ idPlant, mvZeroValue, isOnline }) {
    //Hook personalizado para obtener los acumulados
    const { data, isLoading } = useCurrentMonthAccumulatedData(idPlant, mvZeroValue, isOnline);
    const currentlyData = useMemo(() => {
        return [
            { id: 0, item: "Acumulado Filtración mes actual", value: data?.filtration },
            { id: 1, item: "Acumulado Retrolavado mes actual", value: data?.invwTime },
            { id: 2, item: "Acumulado Enjuague mes actual", value: data?.rinse },
            { id: 3, item: "Acumulado Purgado mes actual", value: data?.purge }
        ];
    }, [data]);
    return (
        <div className="items-panel flex flex-col gap-8">
            <div className="data-currently-div grid grid-cols-2 items-center border-b border-b-[#ccc] gap-3 p-0.5">
                {currentlyData.map(data => (
                    <DataCurrently key={data.id} currentlyData={data} isOnline={isOnline} isLoading={isLoading} />
                ))}
            </div>
        </div>
    )
}
/**
 * Renderiza una fila con la etiqueta y el valor de un dato acumulado.
 * Muestra "Consultando" mientras se carga el valor o "Información no disponible" si la planta está offline.
 * @param {object} props - Las propiedades del componente.
 * @param {{id: number, item: string, value: string}} props.currentlyData - Objeto que contiene el dato a mostrar.
 * @param {boolean} props.isOnline - Indica si la planta está conectada.
 * @returns {JSX.Element} Un fragmento JSX que representa una fila de datos.
 */
function DataCurrently({ currentlyData, isOnline, isLoading }) {
    const displayValue = () => {
        if (!isOnline) return UI_MESSAGES.INFORMATION_NOT_AVAILABLE;
        if (isLoading) return UI_MESSAGES.CONSULTANDO;
        return currentlyData.value ?? UI_MESSAGES.CONSULTANDO;
    };
    return (
        <>
            <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5">
                {currentlyData.item}:
            </span>
            <span className="bg-gray-200 rounded-sm align-middle font-semibold text-gray-600 text-sm md:text-base lg:text-base p-0.5">
                {displayValue()}
            </span>
        </>
    )
}