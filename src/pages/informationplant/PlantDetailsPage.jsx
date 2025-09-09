import DescriptionPanel from './components/DescriptionPanel';
import OperationsPanel from './components/OperationsPanel';
import AcummulatedPanel from './components/AccumulatedPanel';
import { usePlants, useConnectionStatus } from "../../hooks/usePlants";
import { PlantDetailSocketProvider } from '../../context/PlantDetailSocketContext';
import { useParams } from 'react-router-dom';
import { searchPlant } from '../../utils/plantUtils';

function PlantDetailsPage() {
    const { idPlanta } = useParams();
    const { plants, isLoading: loadingPlants } = usePlants();
    //Obtengo información de la planta.
    const plant = !loadingPlants ? searchPlant(plants, idPlanta) : null;
    //Obtengo información del estado de la conexión.
    const { infoConnectionDevice, loading: loadingConnection, error: errorConnection } = useConnectionStatus(plant?.device);
    // Mostramos un estado de carga mientras se obtiene la info de la planta O la info de conexión.
    if (loadingPlants || loadingConnection) return <p className="text-neutral-600  mb-2">Cargando información de la planta, espere por favor.</p>;
    // Mostramos un error si la planta no se encuentra O si hubo un error al obtener la conexión.
    if (!plant || errorConnection) return <p className="text-neutral-600  mb-2">Ocurrió un error. Recargue la página e intente nuevamente.</p>;
    if (!infoConnectionDevice) return <p className="text-neutral-600  mb-2">Cargando información de la planta, espere por favor.</p>;
    return (
        <div className="info-container flex flex-col p-4 overflow-y-auto">
            <h3 className="text-neutral-600 font-bold mb-2 text-2xl">{plant.name}</h3>
            <PlantDetailSocketProvider plantId={infoConnectionDevice?.connection?.online ? plant.id : null} isOnline={infoConnectionDevice?.connection?.online ?? false}>
                <div className="info-containers gap-4 grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(450px,1fr))]">
                    <DescriptionPanel plant={plant} infoConnectionDevice={infoConnectionDevice} />
                    <OperationsPanel plant={plant} isOnline={infoConnectionDevice?.connection?.online ?? false} isLoadingStatus={loadingConnection} />
                    <AcummulatedPanel plant={plant} isOnline={infoConnectionDevice?.connection?.online ?? false} />
                </div>
            </PlantDetailSocketProvider>
        </div>
    );
}

export default PlantDetailsPage;