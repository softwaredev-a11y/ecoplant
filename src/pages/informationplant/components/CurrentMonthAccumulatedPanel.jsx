import { useEffect } from "react";
import { buildDate } from "@/utils/plantUtils";
import { useAccumulatedData } from "@/hooks/useAccumulatedData"; // Importar el nuevo hook
/**
 * Componente que muestra los valores acumulados de operación para el mes actual.
 * Obtiene y calcula los datos de filtración, retrolavado, enjuague y purgado.
 * @param {object} props - Las propiedades del componente.
 * @param {number} props.idPlant - ID de la planta a consultar.
 * @param {string} props.mvZeroValue - Valor 'mv_zero' de la planta, usado para cálculos de caudal.
 * @param {boolean} props.isOnline - Indica si la planta está conectada.
 * @returns {JSX.Element} El panel con los datos acumulados del mes actual.
 */
export default function CurrentMonthAcummulatedPanel({ idPlant, mvZeroValue, isOnline }) {
    //Hook personalizado para obtener los acumulados
    const { data, isLoading, fetchAndCalculateData } = useAccumulatedData();
    const isAuth = sessionStorage.getItem('auth');
    useEffect(() => {
        // Se mantiene la condición para ejecutar la consulta
        if (isOnline && isAuth && idPlant) {
            const consult = async () => {
                await new Promise(resolve => setTimeout(resolve, 15000));
                const date = new Date();
                const beginDate = buildDate(date.getFullYear(), date.getMonth() + 1, 1);
                const currentlyDate = buildDate(date.getFullYear(), date.getMonth() + 1, date.getDate());

                // Llamamos a la función del hook con las fechas correspondientes
                fetchAndCalculateData(idPlant, mvZeroValue, beginDate, currentlyDate);
            };
            consult();
        }
    }, [idPlant, mvZeroValue, isOnline, isAuth, fetchAndCalculateData]);

    const currentlyData = [
        { id: 0, item: "Acumulado Filtración mes actual", value: data?.filtration },
        { id: 1, item: "Acumulado Retrolavado mes actual", value: data?.backwash },
        { id: 2, item: "Acumulado Enjuague mes actual", value: data?.rinse },
        { id: 3, item: "Acumulado Purgado mes actual", value: data?.purge }
    ];

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
        if (!isOnline) return "Información no disponible";
        if (isLoading) return "Consultando";
        return currentlyData.value || "Consultando";
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