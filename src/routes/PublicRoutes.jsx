import { Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/login/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";

/**
 * Define y gestiona las rutas públicas de la aplicación.
 * Este componente utiliza `react-router-dom` para enrutar a los usuarios
 * a la página de inicio de sesión o a una página de "no encontrado".
 * @returns {JSX.Element} El componente de enrutamiento para las secciones públicas.
 */
function PublicRoutes() {
  return (
    <Routes>
      {/* Ruta principal que renderiza la página de inicio de sesión. */}
      <Route path="/" element={<LoginPage />} />
      {/* Ruta comodín que captura cualquier otra URL y muestra la página de "no encontrado". */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default PublicRoutes;
