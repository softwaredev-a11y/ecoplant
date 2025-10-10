import { createContext, useEffect, useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import plantsApi from "@/services/plants.service";
import { SESSION_STORAGE_KEYS_TO_USE, ECOPLANT_GROUPS } from "@/constants/constants"
import { log } from "@/services/logging.service";
/**
 * Contexto de React para almacenar y proporcionar el listado de Ecoplantas asociadas al usuario.
 * @type {React.Context<{plants: Array<object>, isLoading: boolean}>}
 */
export const PlantContext = createContext();

/**
 * Componente proveedor que envuelve la aplicación o partes de ella para
 * proporcionar acceso al contexto de las plantas.
 * Se encarga de obtener los datos de las plantas desde la API o sessionStorage
 * y gestionar el estado de carga.
 * @param {object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes hijos que tendrán acceso al contexto.
 * @returns {JSX.Element}
 */
export const PlantProvider = ({ children }) => {
  const [plants, setPlants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSuperUser, loading: isLoadingUser } = useUsers();

  /**
   * Efecto que se ejecuta al montar el componente o cuando cambia el estado del usuario.
   * Obtiene la lista de plantas, primero intentando desde sessionStorage para caché,
   * y si no, realiza una llamada a la API.
   * La consulta a la API varía si el usuario es un superusuario, si es super usuario, 
   * le muestra todas las Ecoplantas pero si no, solamente las que tiene asignadas.
   */
  useEffect(() => {
    if (isLoadingUser) return;

    // Intenta obtener las plantas desde la caché de la sesión primero.
    const cachedPlants = sessionStorage.getItem(SESSION_STORAGE_KEYS_TO_USE.LIST_PLANTS);
    if (cachedPlants) {
      setPlants(JSON.parse(cachedPlants));
      setIsLoading(false);
      return; // Si tenemos datos en caché, no necesitamos llamar a la API.
    }
    const getPlants = async () => {
      setIsLoading(true);
      try {
        // Si no está en caché, realiza la llamada a la API.
        const params = isSuperUser
          //? { groups: [ECOPLANT_GROUPS.SUPER_USERS_GROUP, ECOPLANT_GROUPS.DEVELOP_GROUP] } // Parámetros para superusuario. Quitar en producción.
          ? { groups: ECOPLANT_GROUPS.SUPER_USERS_GROUP } // Parámetros para superusuario.
          : {}; // Sin parámetros para usuario normal.
        const response = await plantsApi.getPlants(params);
        const plantsData = response.data.data;
        setPlants(plantsData);
        // Guarda los datos en la caché de la sesión para futuras cargas.
        await log('LIST_PLANTS_SUCCESS');
        sessionStorage.setItem(SESSION_STORAGE_KEYS_TO_USE.LIST_PLANTS, JSON.stringify(plantsData));
      } catch (error) {
        await log('LIST_PLANTS_ERROR', { message: error?.message });
      } finally {
        setIsLoading(false);
      }
    };

    getPlants();
  }, [isSuperUser, isLoadingUser]);

  // Proporciona el estado de las plantas y el estado de carga a los componentes hijos.
  return (
    <PlantContext.Provider value={{ plants, isLoading }}>
      {children}
    </PlantContext.Provider>
  );
};
