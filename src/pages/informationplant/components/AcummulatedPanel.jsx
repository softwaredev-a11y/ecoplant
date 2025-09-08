import { useEffect, useState } from "react";
import { useRawDataConsult } from '../../../hooks/usePlants';
import { getMvZeroText, buildDate, thousandsSeparator, calculateAccumulatedValueFiltration, calculateAccumulatedValueRinse, calculateAccumulatedValueBackwash } from "../../../utils/plantUtils";
import HeaderPanel from "./HeaderPanel";

function AcummulatedPanel({ plant }) {
    const [mvZeroValue, setMvZeroValue] = useState(getMvZeroText(plant.info.description));

    const [filtracionActual, setFiltracionActual] = useState("");
    const [enjuagueActual, setEnjuagueActual] = useState("");
    const [retrolavadoActual, setRetrolavadoActual] = useState("");

    const [filtracionAnterior, setFiltracionAnterior] = useState("");
    const [enjuagueAnterior, setEnjuagueAnterior] = useState("");
    const [retrolavadoAnterior, setRetrolavadoAnterior] = useState("");

    const [purgadoMesActual, setPurgadoMesActual] = useState("");

    const { rawDataConsult } = useRawDataConsult();

    useEffect(() => {
        const consultRawData = async (mvZeroValue) => {
            await new Promise(resolve => setTimeout(resolve, 20000));
            const date = new Date();
            const beginDate = buildDate(date.getFullYear(), date.getMonth() + 1, 1);
            const currentlyDate = buildDate(date.getFullYear(), date.getMonth() + 1, date.getDate());

            const dataFiltrado = await rawDataConsult(beginDate, currentlyDate, plant.id, 65);
            const dataEnjuague = await rawDataConsult(beginDate, currentlyDate, plant.id, 32);
            const dataRetrolavado = await rawDataConsult(beginDate, currentlyDate, plant.id, 12);

            const adc_average = dataFiltrado.data.events[0].promedio_adc;
            const caudal = ((adc_average - mvZeroValue) / 100);

            const countFiltrado = dataFiltrado.data.events[0].count;
            const filtracion = calculateAccumulatedValueFiltration(caudal, countFiltrado);
            setFiltracionActual(`${filtracion} gal.`);

            const countEnjuague = dataEnjuague.data.events[0].count;
            const resEnjuague = calculateAccumulatedValueRinse(caudal, countEnjuague);
            setEnjuagueActual(`${resEnjuague} gal.`);

            const countRetrolavado = dataRetrolavado.data.events[0].count;
            const resRetrolavado = calculateAccumulatedValueBackwash(caudal, countRetrolavado);
            setRetrolavadoActual(`${resRetrolavado} gal.`);

            const total_purga_mes_actual = (resEnjuague + resRetrolavado);
            const multiply_purga = total_purga_mes_actual * 0.00378;
            setPurgadoMesActual(`${thousandsSeparator(Math.round(total_purga_mes_actual))} gal (${multiply_purga.toFixed(2)}`);
        };
        consultRawData(mvZeroValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="months-container flex flex-col border border-[#ccc] mb-4 p-0 overflow-y-auto">
            <HeaderPanel title={"Acumulados del mes actual y mes anterior"} />
            <div className="items-panel flex flex-col p-3.5 gap-8">
                <div className="data-currently-div grid grid-cols-2 items-center border-b border-b-[#ccc] gap-3">
                    <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5">
                        Acumulado Filtración mes actual:
                    </span>
                    <span className="bg-gray-200 rounded-sm align-middle font-semibold text-gray-600 text-sm md:text-base lg:text-base p-0.5">
                        {`${filtracionActual === "" ? "Consultando." : filtracionActual}`}
                    </span>
                    <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5">
                        Acumulado Enjuague mes actual:
                    </span>
                    <span className="bg-gray-200 rounded-sm align-middle font-semibold text-gray-600 text-sm md:text-base lg:text-base p-0.5">
                        {`${enjuagueActual === "" ? "Consultando." : enjuagueActual}`}
                    </span>
                    <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5">
                        Acumulado Retrolavado mes actual:
                    </span>
                    <span className="bg-gray-200 rounded-sm align-middle font-semibold text-gray-600 text-sm md:text-base lg:text-base p-0.5">
                        {`${retrolavadoActual === "" ? "Consultando." : retrolavadoActual}`}
                    </span>
                    <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5">
                        Acumulado Purgado mes actual:
                    </span>
                    <span className="bg-gray-200 rounded-sm align-middle font-semibold text-gray-600 text-sm md:text-base lg:text-base p-0.5">
                        {purgadoMesActual === "" ? "Consultando." : (<> {purgadoMesActual} m<sup>3</sup>{")."}</>)}
                    </span>
                </div>

                <div className="data-last-month grid grid-cols-3 items-center border-b border-b-[#ccc] mb-0.5 gap-1.5">
                    <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5">
                        Acumulado Filtración mes anterior:
                    </span>
                    <span className="bg-gray-200 rounded-sm align-middle font-semibold text-gray-600 text-sm md:text-base lg:text-base p-0.5">

                    </span>
                    <button className="p-0.5 border-0 bg-[#005596] rounded-sm text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide">Consultar mes anterior</button>
                    <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5">
                        Acumulado Retrolavado mes anterior:
                    </span>
                    <span className="bg-gray-200 rounded-sm align-middle font-semibold text-gray-600 text-sm md:text-base lg:text-base p-0.5">

                    </span>
                    <button className="p-0.5 border-0 bg-[#005596] rounded-sm text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide">Consultar mes anterior</button>
                    <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5">
                        Acumulado Enjuague mes anterior:
                    </span>
                    <span className="bg-gray-200 rounded-sm align-middle font-semibold text-gray-600 text-sm md:text-base lg:text-base p-0.5">

                    </span>
                    <button className="p-0.5 border-0 bg-[#005596] rounded-sm text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide">Consultar mes anterior</button>
                </div>
            </div>
        </div>
    )
}

export default AcummulatedPanel;