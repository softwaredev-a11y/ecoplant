import { getPlantModel, getSoftwareVersion, stateProcess, formatTime, calculateStateFlow, showCurrentFlow } from '../../../utils/plantUtils';
import { formatEcoplantVersion } from '../../../utils/syrus4Utils'
import notAvailableImg from '../../../assets/images/image-not-available.webp'
import HeaderPanel from './HeaderPanel';
import { usePlantRealTimeData } from '../../../hooks/usePlantRealTimeData';


/**
 * Panel que muestra la información descriptiva de la planta.
 * Incluye la imagen, detalles del modelo, estado de conexión y el proceso actual en ejecución.
 * Se actualiza en tiempo real a través de eventos de WebSocket.
 * @param {object} props - Propiedades del componente.
 * @param {object} props.plant - Objeto con la información de la planta.
 * @param {object} props.infoConnectionDevice - Objeto con el estado de conexión del dispositivo.
 * @returns {JSX.Element} El panel de descripción de la planta.
 */
function DescriptionPanel({ plant, infoConnectionDevice, isSyrus4, syrus4Data, isLoadingSyrus4 }) {
    const { currentlyProccess, currentlyValue, elapsed, begin } = usePlantRealTimeData();
    //Determina si el dispositivo está online
    const isOnline = infoConnectionDevice?.connection?.online;
    const getGpsSignalStatus = () => {
        if (!isOnline) {
            return "Información no disponible"
        }
        if (isSyrus4) {
            if (isLoadingSyrus4) {
                return "Consultando";
            } if (syrus4Data?.gps === undefined) {
                return "Error de comunicación. Intente más tarde."
            }
            return syrus4Data.gps ? "Ok" : "No óptimo";
        }
        return infoConnectionDevice?.latest?.loc?.valid ? "Ok" : "No óptimo";
    };

    const scriptVersion = isSyrus4 ? (isLoadingSyrus4 || !syrus4Data?.apps) ? "Consultando" : formatEcoplantVersion(syrus4Data.apps) : getSoftwareVersion(plant.configuration);
    const gpsSignalStatus = getGpsSignalStatus();
    //Obtiene el último proceso que se ejecutó
    const runningProcessCode = infoConnectionDevice.latest.loc.code;
    //Genera el texto para el procesos en ejecución
    const processDisplayText = isOnline ? currentlyProccess || stateProcess(runningProcessCode) : "Información no disponible";
    // Determina el texto para "Flujo actual"
    const getFlowDisplayText = () => {
        if (!isOnline) return "Información no disponible";
        if (!showCurrentFlow(runningProcessCode)) return "---";
        const flowValue = currentlyValue !== "" ? currentlyValue : calculateStateFlow(infoConnectionDevice.latest.data.ad.value);
        return `${flowValue} gpm`;
    };

    const descriptionData = [
        [
            { label: "Descripción", value: `EcoPlant ${getPlantModel(plant.info.description)}` },
            { label: "Versión del script", value: scriptVersion },
        ],
        [
            { label: "Estado conectividad celular", value: `${isOnline ? "Ok" : "No Ok (Fuera de línea)"}` },
            { label: "Estado del accesorio expansor", value: `${isOnline ? infoConnectionDevice?.ios_state?.io_exp_state ? "Ok" : "No conectado" : "Información no disponible"}` },
            { label: "Estado de señal GPS", value: gpsSignalStatus },
        ],
        [
            { label: "Proceso en ejecución", value: processDisplayText },
            { label: "Flujo actual", value: getFlowDisplayText() },
        ],
    ];

    return (
        <div className="description-container flex flex-col border border-[#ccc] mb-4 p-0 overflow-y-auto">
            <HeaderPanel title={"Descripción"} />
            <div>
                <PlantImage plant={plant} />
            </div>
            <InfoPanel itemGroups={descriptionData} />
            <div className={`flex flex-col items-end p-1.5 ${isOnline ? "" : "hidden"}`}>
                <span className="font-ligth text-gray-600  text-sm p-0.5  align-middle text-right">{` ${begin ? `Última actualización, hace ${formatTime("segundos", elapsed)}` : "Esperando evento..."}`}</span>
            </div>
        </div>
    );
}

/**
 * Renderiza grupos de pares etiqueta-valor en el panel de descripción.
 * @param {object} props - Propiedades del componente.
 * @param {Array<Array<{label: string, value: string|number}>>} props.itemGroups - Grupos de items a mostrar.
 * @returns {JSX.Element|null} El componente que muestra la información o null si no hay datos.
 */
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

/**
 * Muestra la imagen de la planta con un fallback en caso de error.
 * @param {object} props - Propiedades del componente.
 * @param {object} props.plant - Objeto de la planta que contiene el ID para la URL de la imagen.
 * @returns {JSX.Element} El componente de la imagen.
 */
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