import { useCallback, useMemo } from 'react';
import { getFormattedTime } from '@/utils/time';
import notAvailableImg from '@/assets/images/image-not-available.webp'
import useDataDescriptionPanel from '@/hooks/useDataDescriptionPanel';
import HeaderPanel from './HeaderPanel';
/**
 * Panel que muestra la información descriptiva de la planta.
 * Incluye la imagen, detalles del modelo, estado de conexión y el proceso actual en ejecución.
 * Se actualiza en tiempo real a través de eventos de WebSocket.
 * @param {object} props - Propiedades del componente.
 * @param {object} props.plant - Objeto con la información de la planta.
 * @param {object} props.infoConnectionDevice - Objeto con el estado de conexión del dispositivo.
 * @param {object} props.isSyrus4 - Booleano que determina si el dispositivo es un Syrus 4.
 * @param {object} props.syrus4Data - Objeto con la información de dispositivo Syrus 4.
 * @param {object} props.isLoadingSyrus4 - Booleano que determina si la información del dispositivo Syrus 4 se está consultando.
 * @returns {JSX.Element} El panel de descripción de la planta.
 */
function DescriptionPanel({ plant, infoConnectionDevice, isSyrus4, syrus4Data, isLoadingSyrus4 }) {
    //Hook personalizado para obtener los datos del panel de descripción.
    const { data, elapsed, begin } = useDataDescriptionPanel({ plant, infoConnectionDevice, isSyrus4, syrus4Data, isLoadingSyrus4 });

    const descriptionData = useMemo(() => {
        return [
            [
                { label: "Descripción", value: `EcoPlant ${data.ecoplantModel}`, item: 'desc' },
                { label: "Versión del script", value: data.scriptVersion, item: 'script' },
            ],
            [
                { label: "Estado conectividad celular", value: data.isMobileOnline, item: 'phone' },
                { label: "Estado del accesorio expansor", value: data.expansorState, item: 'acc_exp' },
                { label: "Estado de señal GPS", value: data.gpsSignalStatus, item: 'gps' },
            ],
            [
                { label: "Proceso en ejecución", value: data.processDisplayText, item: 'process' },
                { label: "Flujo actual", value: data.currentFlowDisplayText, item: 'current_flow' },
            ],
        ].map(group =>
            // Filtra el item 'acc_exp' si es un Syrus 4
            isSyrus4 ? group.filter(item => item.item !== 'acc_exp') : group
        );
    }, [data, isSyrus4])

    return (
        <div className="description-container flex flex-col border border-[#ccc] mb-4 p-0 overflow-y-auto">
            <HeaderPanel title={"Descripción"} />
            <div>
                <PlantImage plant={plant?.id} />
            </div>
            <InfoRow itemGroups={descriptionData} />
            <div className={`flex flex-col items-end p-1.5 ${data.isOnline ? "" : "hidden"}`}>
                <span className="font-ligth text-gray-600  text-sm p-0.5  align-middle text-right">{` ${begin ? `Última actualización, hace ${getFormattedTime("segundos", elapsed)}` : "Esperando evento..."}`}</span>
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
function InfoRow({ itemGroups }) {
    if (!itemGroups || itemGroups.length === 0) return null;
    return (
        <div className="items-panel flex flex-col p-1.5 gap-4">
            {itemGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="flex flex-col gap-1.5 border-b border-b-[#ccc]">
                    {group.map((item, itemIndex) => (
                        <div className="div grid grid-cols-2 mb-0.5 items-center" key={`${groupIndex}-${itemIndex}`}>
                            <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base">
                                {item.label}:
                            </span>
                            <span className="font-semibold text-gray-600  text-sm md:text-base lg:text-base p-0.5 bg-gray-200 rounded-sm align-middle">
                                {item.value}
                            </span>
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
 * @param {object} props.idPlant - ID de la planta.
 * @returns {JSX.Element} El componente de la imagen.
 */
function PlantImage({ idPlant }) {
    const handleImageError = useCallback((e) => {
        e.target.onerror = null;
        e.target.src = notAvailableImg;
    }, []);
    return (
        <img
            src={`${import.meta.env.VITE_API_URL}/images/vehicles/${idPlant}/photo`}
            alt="Foto de la Ecoplanta." className="w-3/5 max-w-[250px] h-auto block object-contain my-4 mx-auto"
            onError={handleImageError} />
    )
}

export default DescriptionPanel;