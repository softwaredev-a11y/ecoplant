import { useMemo } from "react";
import { getMvZeroText } from "@/utils/syrusUtils";
import HeaderPanel from "../components/HeaderPanel";
import CurrentMonthAccumulatedPanel from "../components/CurrentMonthAccumulatedPanel";
import LastMonthAccumulatedPanel from "../components/LastMonthAccumulatedPanel";
/**
 * Componente que renderiza los paneles de valores acumulados en el mes actual y anterior de la planta.
 * @param {object} props - Las propiedades del componente.
 * @param {object} props.plant - Planta seleccionada y a la cual se le va a calcular los valores acumulados.
 * @param {boolean} props.isOnline - Booleano que determina si el dispositivo está online o no.
 * @returns {JSX.Element} El elemento JSX que contiene los paneles de acumulados.
 */
function AcummulatedPanel({ plant, isOnline }) {
    const mvZeroValue = useMemo(() => getMvZeroText(plant.info.description), [plant.info.description]);
    return (
        <div className="months-container flex flex-col border border-[#ccc] mb-4 p-0 overflow-y-auto">
            <HeaderPanel title={"Acumulados del mes actual y mes anterior"} />
            <div className="items-panel flex flex-col p-1.5 gap-4">
                <CurrentMonthAccumulatedPanel idPlant={plant.id} mvZeroValue={mvZeroValue} isOnline={isOnline} />
                <LastMonthAccumulatedPanel idPlant={plant.id} mvZeroValue={mvZeroValue} isOnline={isOnline} />
            </div>
        </div>
    )
}

export default AcummulatedPanel;