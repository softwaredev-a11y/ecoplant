import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoutes from "./PublicRoutes";
import PrivateRoutes from "./PrivateRoutes";

/**
 * Componente principal de enrutamiento de la aplicación.
 * Define la estructura de nivel superior, separando las rutas públicas
 * (como la página de login) de las rutas privadas (el dashboard),
 * que requieren autenticación.
 * @returns {JSX.Element} El árbol de rutas principal de la aplicación.
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Delega todas las rutas que no coinciden con "/dashboard/*" a PublicRoutes. */}
      <Route path="/*" element={<PublicRoutes />} />

      {/* Delega todas las rutas bajo el prefijo "/dashboard/" a PrivateRoutes. */}
      <Route path="/dashboard/*" element={<PrivateRoutes />} />

      {/* Ruta por defecto: si ninguna de las anteriores coincide, redirige a la raíz. */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default AppRoutes;
