import { useMemo } from "react";
import { getMvZeroText } from "../../../utils/plantUtils";
import HeaderPanel from "../components/HeaderPanel";
import CurrentMonthAcummulatedPanel from "../components/CurrentMonthAccumulatedPanel";
import LasthMontAccumulatedPanel from "../components/LastMonthAccumulatedPanel";

function AcummulatedPanel({ plant }) {
    const mvZeroValue = useMemo(() => getMvZeroText(plant.info.description), [plant.info.description]);

    return (
        <div className="months-container flex flex-col border border-[#ccc] mb-4 p-0 overflow-y-auto">
            <HeaderPanel title={"Acumulados del mes actual y mes anterior"} />
            <div className="items-panel flex flex-col gap-2">
                <CurrentMonthAcummulatedPanel idPlant={plant.id} mvZeroValue={mvZeroValue} />
                <LasthMontAccumulatedPanel idPlant={plant.id} mvZeroValue={mvZeroValue} />
            </div>
        </div>
    )
}

export default AcummulatedPanel;