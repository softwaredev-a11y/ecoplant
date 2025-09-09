import { getPlantModel, getSoftwareVersion, getFlowCurrentlyValue, getCodeCurrentProccess, stateProcess, formatTime, calculateStateFlow } from '../../../utils/plantUtils';
import { usePlantDetailSocket } from '../../../hooks/usePlants';
import notAvailableImg from '../../../assets/images/image-not-available.webp'
import HeaderPanel from './HeaderPanel';
import { useEffect, useState } from 'react';

function DescriptionPanel({ plant, infoConnectionDevice }) {
    const [currentlyValue, setCurrentlyValue] = useState("");
    const [currentlyProccess, setCurrentlyProccess] = useState("");
    const [begin, setBegin] = useState(null);
    const [elapsed, setElapsed] = useState(0);
    const { lastEvent } = usePlantDetailSocket();

    useEffect(() => {
        const message = lastEvent?.payload?.event?.message;
        if (!message) return;
        if (message.includes("REV")) {
            const processCode = getCodeCurrentProccess(message);
            if (processCode !== null) {
                setCurrentlyProccess(stateProcess(processCode));
            }
            const eventTime = lastEvent?.payload?.event?.timestamp || Date.now();
            setBegin(eventTime);
        }
        if (message.includes("BL=")) {
            setCurrentlyValue(getFlowCurrentlyValue(message));
        }
    }, [lastEvent]);

    useEffect(() => {
        if (!begin) return;
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - begin) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [begin]);

    const descriptionData = [
        [
            { label: "Descripción", value: `EcoPlant ${getPlantModel(plant.info.description)}` },
            { label: "Versión del script", value: `${getSoftwareVersion(plant.configuration)}` },
        ],
        [
            { label: "Estado conectividad celular", value: `${infoConnectionDevice?.connection?.online ? "Ok" : "No Ok"}` },
            { label: "Estado del accesorio expansor", value: `${infoConnectionDevice?.ios_state?.io_exp_state ? "Ok" : "No conectado"}` },
            { label: "Estado de señal GPS", value: `${infoConnectionDevice?.latest?.loc?.valid ? "Ok" : "No óptimo"}` },
        ],
        [
            { label: "Proceso en ejecución", value: `${infoConnectionDevice?.connection?.online ?  currentlyProccess === "" ? stateProcess(infoConnectionDevice.latest.loc.code) : currentlyProccess : "Información no disponible"}` },
            { label: "Flujo actual", value: `${infoConnectionDevice?.connection?.online ? currentlyValue === "" ? `${calculateStateFlow(infoConnectionDevice.latest.data.ad.value)} gal/min` : `${currentlyValue} gal/min` : "Información no disponible"}` },
        ],
    ];

    return (
        <div className="description-container flex flex-col border border-[#ccc] mb-4 p-0 overflow-y-auto">
            <HeaderPanel title={"Descripción"} />
            <div>
                <PlantImage plant={plant} />
            </div>
            <InfoPanel itemGroups={descriptionData} />
            <div className={`flex flex-col items-end p-1.5 ${infoConnectionDevice?.connection?.online ? "" : "hidden"}`}>
                <span className="font-ligth text-gray-600  text-sm p-0.5  align-middle text-right">{` ${begin ? `Última actualización, hace  ${formatTime("segundos", elapsed)}` : "Esperando evento..."}`}</span>
            </div>
        </div>
    );
}

function InfoPanel({ itemGroups }) {
    if (!itemGroups || itemGroups.length === 0) return null;
    return (
        <div className="items-panel flex flex-col p-1.5 gap-4">
            {itemGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="flex flex-col gap-1.5 border-b border-b-[#ccc]">
                    {group.map((item, itemIndex) => (
                        <div className="div grid grid-cols-2 mb-0.5 items-center" key={`${groupIndex}-${itemIndex}`}>
                            <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base">
                                {item.label}: </span>
                            <span className="font-semibold text-gray-600  text-sm md:text-base lg:text-base p-0.5 bg-gray-200 rounded-sm align-middle">{item.value} </span>
                        </div>

                    ))}
                </div>
            ))}
        </div>
    );
}

function PlantImage({ plant }) {
    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = notAvailableImg;
    }
    return (
        <img
            src={`https://rastreo.totaltracking.co/api/images/vehicles/${plant.id}/photo`}
            alt="Foto de la Ecoplanta." className="w-3/5 max-w-[250px] h-auto block object-contain my-4 mx-auto"
            onError={handleImageError} />
    )
}

export default DescriptionPanel;