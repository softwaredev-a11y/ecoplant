import { useMemo } from "react";

/**
 * Hook personalizado para filtrar una lista de plantas basado en un término de búsqueda.
 *
 * @param {Array<object>} plants - El array de objetos de plantas a filtrar.
 * @param {string} searchTerm - El término de búsqueda introducido por el usuario.
 * @returns {{filteredPlants: Array<object>, numberPlants: number}} Un objeto que contiene la lista de plantas filtradas y la cantidad de plantas en esa lista.
 */
export function useSearchPlant(plants, searchTerm) {
    const filteredPlants = useMemo(() => {
        if (!searchTerm) {
            return plants;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return plants.filter((plant) =>
            String(plant.name ?? '').toLowerCase().includes(lowerCaseSearchTerm) ||
            String(plant.device ?? '').toLowerCase().includes(lowerCaseSearchTerm) ||
            String(plant.info?.description ?? '').toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [plants, searchTerm]);
    
    return { filteredPlants, numberPlants: filteredPlants.length };
}