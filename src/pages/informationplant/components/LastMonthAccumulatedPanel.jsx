import { buildDate } from "@/utils/syrusUtils";
import { useUsers } from "@/hooks/useUsers";
import { useAccumulatedData } from "@/hooks/useAccumulatedData";
import { useMemo } from "react";
import { UI_MESSAGES } from "@/constants/constants";

/**
 * Componente que muestra los valores acumulados de operación para el mes anterior.
 * Permite a los superusuarios consultar bajo demanda los datos de filtración, retrolavado y enjuague.
 * @param {object} props - Las propiedades del componente.
 * @param {string|number} props.idPlant - ID de la planta a consultar.
 * @param {string|null} props.mvZeroValue - Valor 'mv_zero' de la planta, usado para cálculos de caudal. Viene en la descripción de la planta.
 * @param {boolean} props.isOnline - Indica si la planta está conectada.
 * @returns {JSX.Element | null} El panel con los datos acumulados del mes anterior, o `null` si el usuario no es superusuario.
 */
export default function LastMonthAccumulatedPanel({ idPlant, mvZeroValue, isOnline }) {
    //Hook personalizado para obtener los acumulados
    const { data, isLoading, error, fetchAndCalculateData } = useAccumulatedData();
    const { isSuperUser } = useUsers();

    const handleConsultLastMonth = () => {
        const date = new Date();
        date.setDate(1); // Ir al primer día del mes actual
        date.setMonth(date.getMonth() - 1);

        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        const beginDate = buildDate(year, month, 1);
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = buildDate(year, month, lastDay);

        fetchAndCalculateData(idPlant, mvZeroValue, beginDate, endDate);
    };

    const dataLastMonth = useMemo(() => [
        { id: 0, item: "Acumulado Filtración mes anterior", value: data?.filtration },
        { id: 1, item: "Acumulado Enjuague mes anterior", value: data?.rinse },
        { id: 2, item: "Acumulado Retrolavado mes anterior", value: data?.invwTime },
    ], [data]);

    return (
        <>
            {isSuperUser && (
                <div className="data-last-month grid grid-cols-2 items-center mb-0.5 gap-1.5 p-0.5 border-b border-b-[#ccc]">
                    {dataLastMonth.map((data) => (
                        <DataLastMonth key={data.id}  {...data} isOnline={isOnline} isLoading={isLoading} error={error} />
                    ))}
                    <button onClick={handleConsultLastMonth}
                        disabled={isLoading || !isOnline || !!data}
                        className={`mb-0.5 col-span-1 p-0.5 border-0 bg-[#005596] rounded-sm text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide disabled:cursor-not-allowed`}>
                        {isLoading && UI_MESSAGES.CONSULTANDO}
                        {!isLoading && data && UI_MESSAGES.CONSULTADO}
                        {!isLoading && !data && error && UI_MESSAGES.DATA_NOT_FOUND}
                        {!isLoading && !data && !error && "Consultar acumulados mes anterior"}
                    </button>
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
 * @param {boolean} props.isOnline - Indica si la planta está conectada.
 * @param {boolean} props.isLoading - Indica si este dato específico se está cargando actualmente.
 * @param {string|null} props.error - Mensaje de error si la carga falló.
 * @returns {JSX.Element} Un fragmento JSX que representa una fila de datos del mes anterior.
 */
function DataLastMonth({ item, value, isOnline, isLoading, error }) {
    const displayValue = () => {
        if (!isOnline) return UI_MESSAGES.INFORMATION_NOT_AVAILABLE;
        if (isLoading) return UI_MESSAGES.CONSULTANDO;
        if (error && value === undefined) return UI_MESSAGES.COMMUNICATION_PROBLEMS;
        // Si el valor es undefined, significa que aún no se ha consultado.
        // Usamos un espacio de no ruptura para mantener la altura de la línea.
        if (value === undefined) return "\u00A0";
        return value;
    };
    return (
        <>
            <span className={`item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5`}>
                {item}:
            </span>
            <span className="bg-gray-200 rounded-sm align-middle font-semibold text-gray-600 text-sm md:text-base lg:text-base p-0.5">
                {displayValue()}
            </span>
        </>
    );
}
