import { useState } from "react";
import { useRawDataConsult } from '@/hooks/usePlants';
import { buildDate, thousandsSeparator, calculateAccumulatedValueFiltration, calculateAccumulatedValueRinse, calculateAccumulatedValueBackwash } from "@/utils/plantUtils";

export default function LastMonthAccumulatedPanel({ idPlant, mvZeroValue }) {
    const { rawDataConsult } = useRawDataConsult();

    const [filtracionAnterior, setFiltracionAnterior] = useState("");
    const [enjuagueAnterior, setEnjuagueAnterior] = useState("");
    const [retrolavadoAnterior, setRetrolavadoAnterior] = useState("");

    const handleConsult = async (code, setValue, type) => {
        const date = new Date();
        const year = date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear();
        const month = date.getMonth() === 0 ? 12 : date.getMonth();

        const beginDate = buildDate(year, month, 1);
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = buildDate(year, month, lastDay);

        const dataFiltrado = await rawDataConsult(beginDate, endDate, idPlant, 65);
        const data = await rawDataConsult(beginDate, endDate, idPlant, code);

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

        setValue(`${thousandsSeparator(Math.round(result))} gal.`);
    };

    const dataLastMonth = [
        {
            id: 0,
            item: "Acumulado Filtración mes anterior",
            value: filtracionAnterior,
            onConsult: () => handleConsult(65, setFiltracionAnterior, "filtracion"),
        },
        {
            id: 1,
            item: "Acumulado Enjuague mes anterior",
            value: enjuagueAnterior,
            onConsult: () => handleConsult(32, setEnjuagueAnterior, "enjuague"),
        },
        {
            id: 2,
            item: "Acumulado Retrolavado mes anterior",
            value: retrolavadoAnterior,
            onConsult: () => handleConsult(12, setRetrolavadoAnterior, "retrolavado"),
        },
    ];

    return (
        <div className="data-last-month grid grid-cols-2 items-center border-b border-b-[#ccc] mb-0.5 gap-1.5 p-0.5">
            {dataLastMonth.map((data) => (
                <DataLastMonth key={data.id} {...data} />
            ))}
        </div>
    );
}

function DataLastMonth({ item, value, onConsult }) {
    return (
        <>
            <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5">
                {item}:
            </span>
            {value ? (
                <span className="bg-gray-200 rounded-sm align-middle font-semibold text-gray-600 text-sm md:text-base lg:text-base p-0.5">
                    {value}
                </span>
            ) : (
                <button onClick={onConsult} className="p-0.5 border-0 bg-[#005596] rounded-sm text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide">
                    Consultar mes anterior
                </button>
            )}
        </>
    );
}
