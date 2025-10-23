import { useParams } from 'react-router-dom';
import { usePlantInfo } from "@/hooks/usePlantInfo";
import { PlantDetailSocketProvider } from '@/context/PlantDetailSocketContext';
import { UI_MESSAGES } from '@/constants/constants';
import StatusMessage from '@/components/StatusMessage';
import DescriptionPanel from './components/DescriptionPanel';
import OperationsPanel from './components/OperationsPanel';
import AccumulatedPanel from './components/AccumulatedPanel';
/**
 * Página que muestra los detalles de una planta específica.
 * Obtiene la información de la planta, su estado de conexión y renderiza los paneles
 * con la información detallada, operaciones y acumulados.
 * @returns {JSX.Element}
 */
function PlantDetailsPage() {
    const { plantId } = useParams();
    const { plant, infoConnectionDevice, isOnline, isSyrus4, syrus4Data, isLoadingSyrus4, errorConnection, loadingPlants, loadingConnection } = usePlantInfo(plantId);
    // Agrupa las props que se repiten en varios componentes para mayor claridad.
    const commonPanelProps = { plant, isSyrus4, syrus4Data, isLoadingSyrus4 };
    return (
        <PlantDetailSocketProvider plantId={isOnline ? plant?.id : null} isOnline={isOnline}>
            <div className="info-container flex flex-col p-4 overflow-y-auto">
                {loadingPlants || loadingConnection ? (
                    <StatusMessage message={UI_MESSAGES.LOADING_INFO_ECOPLANT} />
                ) : !plant || errorConnection || !infoConnectionDevice ? (
                    <StatusMessage message={UI_MESSAGES.ERROR_OCCURRED} />
                ) : (
                    <>
                        <h3 className="text-neutral-600 font-bold mb-2 text-2xl">{plant.name}</h3>
                        <div className="info-containers gap-4 grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(450px,1fr))]">
                            <DescriptionPanel {...commonPanelProps} infoConnectionDevice={infoConnectionDevice} />
                            <OperationsPanel {...commonPanelProps} isOnline={isOnline} isLoadingStatus={loadingConnection} />
                            <AccumulatedPanel {...commonPanelProps} isOnline={isOnline} />
                        </div>
                    </>
                )}
            </div>
        </PlantDetailSocketProvider>
    );
}

export default PlantDetailsPage;