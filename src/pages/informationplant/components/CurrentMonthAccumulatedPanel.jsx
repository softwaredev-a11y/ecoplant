import { useEffect, useState } from "react";
import { useRawDataConsult } from '@/hooks/usePlants';
import { buildDate, thousandsSeparator, calculateAccumulatedValueFiltration, calculateAccumulatedValueRinse, calculateAccumulatedValueBackwash } from "@/utils/plantUtils";

export default function CurrentMonthAcummulatedPanel({ idPlant, mvZeroValue, isOnline }) {
    const { rawDataConsult } = useRawDataConsult();

    const [filtracionActual, setFiltracionActual] = useState("");
    const [enjuagueActual, setEnjuagueActual] = useState("");
    const [retrolavadoActual, setRetrolavadoActual] = useState("");
    const [purgadoMesActual, setPurgadoMesActual] = useState("");
    const isAuth = sessionStorage.getItem('auth');

    const currentlyData = [
        { id: 0, item: "Acumulado Filtración mes actual", value: filtracionActual },
        { id: 1, item: "Acumulado Retrolavado mes actual", value: enjuagueActual },
        { id: 2, item: "Acumulado Enjuague mes actual", value: retrolavadoActual },
        { id: 3, item: "Acumulado Purgado mes actual", value: purgadoMesActual }
    ]


    useEffect(() => {
        let ignore = false;

        const consultRawData = async (mvZeroValue, isAuth) => {
            if (isOnline && isAuth) {
                await new Promise(resolve => setTimeout(resolve, 20000));
                if (ignore) return;

                const date = new Date();
                const beginDate = buildDate(date.getFullYear(), date.getMonth() + 1, 1);
                const currentlyDate = buildDate(date.getFullYear(), date.getMonth() + 1, date.getDate());

                const dataFiltrado = await rawDataConsult(beginDate, currentlyDate, idPlant, 65);
                await new Promise(resolve => setTimeout(resolve, 2000));
                const dataEnjuague = await rawDataConsult(beginDate, currentlyDate, idPlant, 32);
                await new Promise(resolve => setTimeout(resolve, 2000));
                const dataRetrolavado = await rawDataConsult(beginDate, currentlyDate, idPlant, 12);

                if (ignore) return;

                if (dataFiltrado?.data?.events?.[0]) {
                    const adc_average = dataFiltrado.data.events[0].promedio_adc;
                    const caudal = ((adc_average - mvZeroValue) / 100);

                    const countFiltrado = dataFiltrado.data.events[0].count;
                    const filtracion = calculateAccumulatedValueFiltration(caudal, countFiltrado);
                    setFiltracionActual(`${thousandsSeparator(Math.round(filtracion))} gal`);

                    const countEnjuague = dataEnjuague.data.events[0].count;
                    const resEnjuague = calculateAccumulatedValueRinse(caudal, countEnjuague);
                    setEnjuagueActual(`${thousandsSeparator(Math.round(resEnjuague))} gal`);

                    const countRetrolavado = dataRetrolavado.data.events[0].count;
                    const resRetrolavado = calculateAccumulatedValueBackwash(caudal, countRetrolavado);
                    setRetrolavadoActual(`${thousandsSeparator(Math.round(resRetrolavado))} gal`);

                    const total_purga_mes_actual = (resEnjuague + resRetrolavado);
                    const multiply_purga = total_purga_mes_actual * 0.00378;
                    setPurgadoMesActual(`${thousandsSeparator(Math.round(total_purga_mes_actual))} gal (${multiply_purga.toFixed(2)} m³)`);
                }
            }
        };
        consultRawData(mvZeroValue, isAuth);

        return () => {
            ignore = true;
        };
    }, [idPlant]);


    return (
        <div className="items-panel flex flex-col gap-8">
            <div className="data-currently-div grid grid-cols-2 items-center border-b border-b-[#ccc] gap-3 p-0.5">
                {currentlyData.map(data => (
                    <DataCurrently key={data.id} currentlyData={data} isOnline={isOnline} />
                ))}
            </div>
        </div>
    )
}

function DataCurrently({ currentlyData, isOnline }) {
    return (
        <>
            <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5">
                {currentlyData.item}:
            </span>
            <span className="bg-gray-200 rounded-sm align-middle font-semibold text-gray-600 text-sm md:text-base lg:text-base p-0.5">
                {`${isOnline ? currentlyData.value === "" ? "Consultando" : currentlyData.value : "Información no disponible"}`}
            </span>
        </>
    )
}