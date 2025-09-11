import { useState } from "react";
import { useRawDataConsult } from '@/hooks/usePlants';
import { buildDate, thousandsSeparator, calculateAccumulatedValueFiltration, calculateAccumulatedValueRinse, calculateAccumulatedValueBackwash } from "@/utils/plantUtils";
import { useUsers } from "@/hooks/useUsers";

export default function LastMonthAccumulatedPanel({ idPlant, mvZeroValue, isOnline }) {
    const { rawDataConsult } = useRawDataConsult();
    const [loadingType, setLoadingType] = useState(null);

    const [filtracionAnterior, setFiltracionAnterior] = useState("");
    const [enjuagueAnterior, setEnjuagueAnterior] = useState("");
    const [retrolavadoAnterior, setRetrolavadoAnterior] = useState("");
    const { isSuperUser } = useUsers();

    const isButtonDisabled = loadingType !== null || !isSuperUser;

    const handleConsult = async (code, setValue, type) => {
        setLoadingType(type);
        try {
            const date = new Date();
            const year = date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear();
            const month = date.getMonth() === 0 ? 12 : date.getMonth();

            const beginDate = buildDate(year, month, 1);
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = buildDate(year, month, lastDay);

            const [dataFiltrado, data] = await Promise.all([
                rawDataConsult(beginDate, endDate, idPlant, 65),
                rawDataConsult(beginDate, endDate, idPlant, code)
            ]);

            if (!dataFiltrado?.data?.events?.[0] || !data?.data?.events?.[0]) {
                setValue("No disponible");
                return;
            }

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

            setValue(`${thousandsSeparator(Math.round(result))} gal`);
        } catch (error) {
            console.error("Error al consultar los datos del mes anterior:", error);
            setValue("Error");
        } finally {
            setLoadingType(null);
        }
    };

    const dataLastMonth = [
        {
            id: 0,
            item: "Acumulado Filtración mes anterior",
            value: filtracionAnterior,
            onConsult: () => handleConsult(65, setFiltracionAnterior, "filtracion"),
            type: "filtracion",
        },
        {
            id: 1,
            item: "Acumulado Enjuague mes anterior",
            value: enjuagueAnterior,
            onConsult: () => handleConsult(32, setEnjuagueAnterior, "enjuague"),
            type: "enjuague",
        },
        {
            id: 2,
            item: "Acumulado Retrolavado mes anterior",
            value: retrolavadoAnterior,
            onConsult: () => handleConsult(12, setRetrolavadoAnterior, "retrolavado"),
            type: "retrolavado",
        },
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
                            isButtonDisabled={isButtonDisabled}
                            isCurrentlyLoading={loadingType === data.type}
                            isSuperUser={isSuperUser}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

function DataLastMonth({ item, value, onConsult, isOnline, isButtonDisabled, isCurrentlyLoading, isSuperUser }) {
    return (
        <>
            <span className={`item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5 ${isSuperUser ? "" : "hidden"}`}>
                {item}:
            </span>
            {value || !isOnline ? (
                <span className="bg-gray-200 rounded-sm align-middle font-semibold text-gray-600 text-sm md:text-base lg:text-base p-0.5">
                    {isOnline && value ? value : "Información no disponible"}
                </span>
            ) : (
                <button onClick={onConsult}
                    disabled={isButtonDisabled}
                    className={`p-0.5 border-0 bg-[#005596] rounded-sm text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide ${isOnline ? '' : 'hidden'} ${isSuperUser ? "" : "hidden"} disabled:cursor-not-allowed`}>
                    {
                        isCurrentlyLoading ? "Consultando" : " Consultar mes anterior"
                    }
                </button>
            )}
        </>
    );
}
