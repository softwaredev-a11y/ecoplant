import DescriptionPanel from './components/DescriptionPanel';
import OperationsPanel from './components/OperationsPanel';
import AccumulatedPanel from './components/AccumulatedPanel';
import { usePlantInfo } from "../../hooks/usePlantInfo";
import { PlantDetailSocketProvider } from '@/context/PlantDetailSocketContext';
import { useParams } from 'react-router-dom';
import StatusMessage from '@/components/StatusMessage';
/**
 * Página que muestra los detalles de una planta específica.
 * Obtiene la información de la planta, su estado de conexión y renderiza los paneles
 * con la información detallada, operaciones y acumulados.
 * @returns {JSX.Element}
 */
function PlantDetailsPage() {
    const { idPlanta } = useParams();
    const { plant, infoConnectionDevice, isOnline, isSyrus4, syrus4Data, isLoadingSyrus4, errorConnection, loadingPlants, loadingConnection } = usePlantInfo(idPlanta);
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
                            <AccumulatedPanel plant={plant} isOnline={isOnline} />
                        </div>
                    </>
                )}
            </div>
        </PlantDetailSocketProvider>
    );
}

export default PlantDetailsPage;