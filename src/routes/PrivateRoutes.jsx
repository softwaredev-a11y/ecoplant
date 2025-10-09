import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardIndexPage from "@/pages/dashboard/DashboardIndexPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { PlantProvider } from "@/context/PlantContext";
import { UserProvider } from "@/context/UserInfoContext";
import ProtectedRoute from "./ProtectedRoute";
import { lazy, Suspense } from 'react';
import StatusMessage from '@/components/StatusMessage';

/**
 * Componente de layout que envuelve las rutas protegidas con los proveedores de contexto necesarios.
 * Proporciona `UserContext` y `PlantContext` a todas las rutas anidadas.
 * @returns {JSX.Element} Un Outlet renderizado dentro de los proveedores de contexto.
 */
const ProtectedProvidersLayout = () => (
  <UserProvider>
    <PlantProvider>
      <Outlet />
    </PlantProvider>
  </UserProvider>
);
//Inicialización Lazy para evitar cargar toda la aplicación cuando se abre.
const PlantDetailsPage = lazy(() => import('../pages/informationplant/PlantDetailsPage'));

/**
 * Define y gestiona las rutas privadas de la aplicación, accesibles solo para usuarios autenticados.
 * Utiliza `ProtectedRoute` para asegurar la autenticación y `ProtectedProvidersLayout` para
 * inyectar los contextos necesarios en el árbol de componentes.
 * @returns {JSX.Element} El componente de enrutamiento para las secciones privadas del dashboard.
 */
function PrivateRoutes() {
  return (
    <Routes>
      {/* Envuelve todas las rutas privadas para verificar la autenticación. */}
      <Route element={<ProtectedRoute />}>
        {/* Envuelve el layout del dashboard y sus sub-rutas con los proveedores de contexto. */}
        <Route element={<ProtectedProvidersLayout />}>
          {/* Ruta principal del dashboard que utiliza DashboardLayout. */}
          <Route path="/" element={<DashboardLayout />}>
            {/* Ruta de índice que se muestra en la raíz del dashboard. */}
            <Route index element={<DashboardIndexPage />} />
            {/* Ruta para ver los detalles de una planta específica. */}
            <Route path="planta/:idPlanta" element={
              <Suspense fallback={
                <StatusMessage message={"Cargando información de la planta, espere por favor."} />
              }>
                <PlantDetailsPage />
              </Suspense>
            } />
            {/* Ruta comodín para cualquier sub-ruta no encontrada dentro del dashboard. */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Route>
      {/* Redirige cualquier otra ruta privada no coincidente al dashboard principal. */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default PrivateRoutes;
