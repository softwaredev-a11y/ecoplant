import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import DashboardLayout from "../layouts/DashboardLayout";
import PlantDetailsPage from "../pages/PlantDetailsPage";
import NotFoundPage from "../pages/NotFoundPage";
import DashboardIndexPage from "../pages/DashboardIndexPage";

/**
 * Componente que define la estructura de rutas de la aplicación.
 * Utiliza `react-router-dom` para gestionar la navegación entre las diferentes páginas.
 *
 * @returns {JSX.Element} El componente de rutas para la aplicación.
 */
function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            {/* Ruta de layout para el dashboard, que envuelve a las rutas anidadas. */}
            <Route path="/dashboard" element={<DashboardLayout />}>
                {/* Ruta de índice: se renderiza por defecto en el Outlet del dashboard. */}
                <Route index element={<DashboardIndexPage />} />
                {/* Ruta dinámica para mostrar los detalles de una planta específica. */}
                <Route path="planta/:idPlanta" element={<PlantDetailsPage />} />
            </Route>
            {/* Ruta catch-all para 404 Not Found. Se activa si ninguna otra ruta coincide. */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default AppRoutes;