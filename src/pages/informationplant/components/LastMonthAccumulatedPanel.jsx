import { buildDate } from "@/utils/plantUtils";
import { useUsers } from "@/hooks/useUsers";
import { useAccumulatedData } from "@/hooks/useAccumulatedData";
import { useState } from "react";

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
    const { data, isLoading, fetchAndCalculateData } = useAccumulatedData();
    const [isConsulted, setIsConsulted] = useState(false);
    const { isSuperUser } = useUsers();

    /**
     * Consulta y calcula el valor acumulado para una operación específica del mes anterior.
     * @param {number} code - El código de operación a consultar (filtración, enjuague, etc.).
     * @param {function(string): void} setValue - La función para actualizar el estado del valor calculado.
     * @param {string} type - El tipo de operación (ej. "filtracion", "enjuague") para gestionar el estado de carga.
     */
    const handleConsultLastMonth = () => {
        const date = new Date();
        const year = date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear();
        const month = date.getMonth() === 0 ? 12 : date.getMonth();

        const beginDate = buildDate(year, month, 1);
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = buildDate(year, month, lastDay);

        fetchAndCalculateData(idPlant, mvZeroValue, beginDate, endDate);
        setIsConsulted(true);
    };
    const dataLastMonth = [
        { id: 0, item: "Acumulado Filtración mes anterior", value: data?.filtration },
        { id: 1, item: "Acumulado Enjuague mes anterior", value: data?.rinse },
        { id: 2, item: "Acumulado Retrolavado mes anterior", value: data?.backwash },
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
                            isLoading={isLoading}
                        />
                    ))}
                    <span></span>
                    <button onClick={handleConsultLastMonth}
                        disabled={isLoading || !isOnline || isConsulted}
                        className={`col-span-1 p-0.5 border-0 bg-[#005596] rounded-sm text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide disabled:cursor-not-allowed`}>
                        {isLoading ? "Consultando..." :
                            isConsulted ? "Consultado" : "Consultar acumulados mes anterior"}
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
 * @param {function(): void} props.onConsult - Función a ejecutar cuando se hace clic en el botón de consulta.
 * @param {boolean} props.isOnline - Indica si la planta está conectada.
 * @param {boolean} props.isButtonDisabled - Indica si el botón de consulta debe estar deshabilitado.
 * @param {boolean} props.isCurrentlyLoading - Indica si este dato específico se está cargando actualmente.
 * @param {boolean} props.isSuperUser - Indica si el usuario actual tiene permisos de superusuario. Esto determina si puede realizar o no la consulta.
 * @returns {JSX.Element} Un fragmento JSX que representa una fila de datos del mes anterior.
 */
function DataLastMonth({ item, value, isOnline, isLoading }) {
    const displayValue = () => {
        if (!isOnline) return "Información no disponible";
        // Si el valor es undefined, significa que aún no se ha consultado.
        if (value === undefined) return "\u00A0";
        if (isLoading) return "Consultando";
        // El hook ya se encarga de los casos "No disponible" o "Error"
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
