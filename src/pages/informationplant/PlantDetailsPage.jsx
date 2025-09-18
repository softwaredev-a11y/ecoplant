import DescriptionPanel from './components/DescriptionPanel';
import OperationsPanel from './components/OperationsPanel';
import AcummulatedPanel from './components/AccumulatedPanel';
import { usePlants, useConnectionStatus } from "../../hooks/usePlants";
import { PlantDetailSocketProvider } from '../../context/PlantDetailSocketContext';
import { useParams } from 'react-router-dom';
import { searchPlant } from '../../utils/plantUtils';
import StatusMessage from '../../components/StatusMessage';
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
    const plant = !loadingPlants ? searchPlant(plants, idPlanta) : null;

    // Obtiene el estado de conexión del dispositivo asociado a la planta.
    const { infoConnectionDevice, loading: loadingConnection, error: errorConnection } = useConnectionStatus(plant?.device);

    // Muestra un estado de carga mientras se obtiene la info de la planta O la info de conexión.
    if (loadingPlants || loadingConnection) return <StatusMessage message={"Cargando información de la planta, espere por favor."} />;
    // Muestra un error si la planta no se encuentra O si hubo un error al obtener la conexión.
    if (!plant || errorConnection) return <StatusMessage message={"Ocurrió un error. Recargue la página e intente nuevamente."} />;
    if (!infoConnectionDevice) return <StatusMessage message={">Cargando información de la planta, espere por favor."} />;
    // Define el estado de conexión en una variable para mayor claridad y reutilización.
    const isOnline = infoConnectionDevice?.connection?.online ?? false;
    return (
        <div className="info-container flex flex-col p-4 overflow-y-auto">
            <h3 className="text-neutral-600 font-bold mb-2 text-2xl">{plant.name}</h3>
            <PlantDetailSocketProvider plantId={isOnline ? plant.id : null} isOnline={isOnline}>
                <div className="info-containers gap-4 grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(450px,1fr))]">
                    <DescriptionPanel plant={plant} infoConnectionDevice={infoConnectionDevice} />
                    <OperationsPanel plant={plant} isOnline={isOnline} isLoadingStatus={loadingConnection} />
                    <AcummulatedPanel plant={plant} isOnline={isOnline} />
                </div>
            </PlantDetailSocketProvider>
        </div>
    );
}

export default PlantDetailsPage;