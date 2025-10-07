import { useEffect, useMemo } from "react";
import { usePlants, useConnectionStatus } from "./usePlants";
import { useSyrus4Data } from './useSyrus4Data';
import { searchPlant } from '@/utils/syrusUtils';

/**
 * Hook personalizado que centraliza la lógica para obtener toda la información de una planta específica.
 * Este hook realiza las siguientes acciones:
 * 1. Busca la planta en la lista general de plantas.
 * 2. Obtiene el estado de conexión del dispositivo asociado.
 * 3. Determina si el dispositivo es un Syrus 4.
 * 4. Si es un Syrus 4, inicia la obtención de datos específicos para ese modelo.
 * @param {string|number} idPlanta - El ID de la planta a consultar.
 * @returns {{ plant: object|null, infoConnectionDevice: object|null, isOnline: boolean,  isSyrus4: boolean, syrus4Data: object, isLoadingSyrus4: boolean, errorConnection: string|null,  loadingPlants: boolean, loadingConnection: boolean }} Un objeto que contiene toda la información consolidada de la planta y los estados de carga/error.
 */
export function usePlantInfo(idPlanta) {
    const { plants, isLoading: loadingPlants } = usePlants();
    //Obtiene la planta
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
    // Define el estado de conexión en una variable para mayor claridad y reutilización.
    const isOnline = useMemo(() => {
        return infoConnectionDevice?.connection?.online ?? false;
    }, [infoConnectionDevice?.connection?.online])

    useEffect(() => {
        //Este condicional evita la condición de carrera cuando se pasa de un s4 a un s3.
        //Esto evita que se realicen consultas de S4 a APIS de S3.
        if (plant?.device === infoConnectionDevice?.imei && !loadingConnection) {
            if (plant && isOnline && isSyrus4) {
                fetchSyrus4Data();
            }
        }
    }, [plant, infoConnectionDevice, isSyrus4, isOnline, loadingConnection, fetchSyrus4Data]);
    return { plant, infoConnectionDevice, isOnline, isSyrus4, syrus4Data, isLoadingSyrus4, errorConnection, loadingPlants, loadingConnection };
}