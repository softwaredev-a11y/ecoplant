import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoutes from "./PublicRoutes";
import PrivateRoutes from "./PrivateRoutes";

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/*" element={<PublicRoutes />} />

      {/* Rutas privadas */}
      <Route path="/dashboard/*" element={<PrivateRoutes />} />

      {/* Default */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default AppRoutes;
