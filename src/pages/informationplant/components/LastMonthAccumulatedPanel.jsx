import { useState } from "react";
export default function LasthMontAccumulatedPanel({ idPlant, mvZeroValue }) {

    const [filtracionAnterior, setFiltracionAnterior] = useState("");
    const [enjuagueAnterior, setEnjuagueAnterior] = useState("");
    const [retrolavadoAnterior, setRetrolavadoAnterior] = useState("");

 
    const dataLastMonth = [
        { id: 0, item: "Acumulado Filtración mes anterior", value: filtracionAnterior },
        { id: 1, item: "Acumulado Retrolavado mes anterior", value: enjuagueAnterior },
        { id: 2, item: "Acumulado Enjuague mes anterior", value: retrolavadoAnterior },
    ]
    return (
        <div className="data-last-month grid grid-cols-2 items-center border-b border-b-[#ccc] mb-0.5 gap-1.5 p-3.5">
            {dataLastMonth.map(data => (
                <DataLastMonth key={data.id} dataLastMonth={data} />
            ))}
        </div>
    )
}

function DataLastMonth({ dataLastMonth }) {
    return (
        <>
            <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5">
                {dataLastMonth.item}:
            </span>
            <span className={`bg-gray-200 rounded-sm align-middle font-semibold text-gray-600 text-sm md:text-base lg:text-base p-0.5 ${dataLastMonth.value === "" ? "hidden":"block"}`}>
                {dataLastMonth.value}
            </span>
            <button className={`p-0.5 border-0 bg-[#005596] rounded-sm text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide ${dataLastMonth.value === "" ? "block" : "hidden"}`}>Consultar mes anterior</button>
        </>
    )
}