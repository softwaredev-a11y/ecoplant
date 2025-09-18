import { createContext, useEffect, useState } from "react";
import plantsApi from "@/services/plants.service";
import { useUsers } from "@/hooks/useUsers";

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
   * La consulta a la API varía si el usuario es un superusuario.
   */
  useEffect(() => {
    // Espera a que la información del usuario esté disponible.
    if (isLoadingUser) {
      return;
    }
    const getPlants = async () => {
      setIsLoading(true);
      try {
        // Intenta obtener las plantas desde la caché de la sesión.
        const listPlants = sessionStorage.getItem('listPlants');
        if (listPlants) {
          setPlants(JSON.parse(listPlants))
        } else {
          // Si no está en caché, realiza la llamada a la API.
          const params = isSuperUser
            ? { groups: "123" } // Parámetros para superusuario.
            : {}; // Sin parámetros para usuario normal.
          const response = await plantsApi.getPlants(params);
          const plantsData = response.data.data;
          setPlants(plantsData);
          // Guarda los datos en la caché de la sesión para futuras cargas.
          sessionStorage.setItem('listPlants', JSON.stringify(plantsData));
        }
      } catch (error) {
        console.error("Error cargando plantas:", error);
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
