import DescriptionPanel from './components/DescriptionPanel';
import OperationsPanel from './components/OperationsPanel';
import AcummulatedPanel from './components/AccumulatedPanel';
import { usePlants, useConnectionStatus } from "../../hooks/usePlants";
import { useSyrus4Data } from '../../hooks/useSyrus4Data';
import { PlantDetailSocketProvider } from '../../context/PlantDetailSocketContext';
import { useParams } from 'react-router-dom';
import { searchPlant } from '@/utils/syrusUtils';
import StatusMessage from '@/components/StatusMessage';
import { useEffect, useMemo } from 'react';
/**
 * Página que muestra los detalles de una planta específica.
 * Obtiene la información de la planta, su estado de conexión y renderiza los paneles
 * con la información detallada, operaciones y acumulados.
 * @returns {JSX.Element}
 */
function PlantDetailsPage() {
    const { idPlanta } = useParams();
    const { plants, isLoading: loadingPlants } = usePlants();

    // Busca la información de la planta una vez que la lista de plantas ha cargado.
    const plant = !loadingPlants && Array.isArray(plants) ? searchPlant(plants, idPlanta) : null;

    // Obtiene el estado de conexión del dispositivo asociado a la planta.
    const { infoConnectionDevice, loading: loadingConnection, error: errorConnection } = useConnectionStatus(plant?.device);
    //Determina si es syrus 4
    const isSyrus4 = useMemo(
        () => infoConnectionDevice?.version?.vkey_model?.toLowerCase().includes('syrus 4') || infoConnectionDevice?.version?.vkey_model?.toLowerCase().includes('s4') || infoConnectionDevice?.version?.vkey_model?.toLowerCase().includes('4g'),
        [infoConnectionDevice]
    );
    // Llama al hook personalizado para la lógica de Syrus 4.
    const { syrus4Data, isLoading: isLoadingSyrus4, fetchData: fetchSyrus4Data } = useSyrus4Data(plant, isSyrus4);

    useEffect(() => {
        const isOnline = infoConnectionDevice?.connection?.online ?? false;
        if (plant?.device === infoConnectionDevice?.imei && !loadingConnection) {
            if (plant && isOnline && isSyrus4) {
                fetchSyrus4Data();
            }
        }
    }, [plant, infoConnectionDevice, isSyrus4, loadingConnection, fetchSyrus4Data]);

    // Define el estado de conexión en una variable para mayor claridad y reutilización.
    const isOnline = infoConnectionDevice?.connection?.online ?? false;

    return (
        <PlantDetailSocketProvider plantId={isOnline ? plant?.id : null} isOnline={isOnline}>
            <div className="info-container flex flex-col p-4 overflow-y-auto">
                {loadingPlants || loadingConnection ? (
                    <StatusMessage message={"Cargando información de la planta, espere por favor."} />
                ) : !plant || errorConnection || !infoConnectionDevice ? (
                    <StatusMessage message={"Ocurrió un error. Recargue la página e intente nuevamente."} />
                ) : (
                    <>
                        <h3 className="text-neutral-600 font-bold mb-2 text-2xl">{plant.name}</h3>
                        <div className="info-containers gap-4 grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(450px,1fr))]">
                            <DescriptionPanel plant={plant} infoConnectionDevice={infoConnectionDevice} isSyrus4={isSyrus4} syrus4Data={syrus4Data} isLoadingSyrus4={isLoadingSyrus4} />
                            <OperationsPanel plant={plant} isOnline={isOnline} isLoadingStatus={loadingConnection} isSyrus4={isSyrus4} syrus4Data={syrus4Data} isLoadingSyrus4={isLoadingSyrus4} />
                            <AcummulatedPanel plant={plant} isOnline={isOnline} />
                        </div>
                    </>
                )}
            </div>
        </PlantDetailSocketProvider>
    );
}

export default PlantDetailsPage;