import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardIndexPage from "../pages/DashboardIndexPage";
import PlantDetailsPage from "../pages/PlantDetailsPage";
import NotFoundPage from "../pages/NotFoundPage";
import { PlantProvider } from "../context/PlantContext";

function PrivateRoutes() {
  return (
    <PlantProvider>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardIndexPage />} />
          <Route path="planta/:idPlanta" element={<PlantDetailsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Por si alguien pone mal la URL de dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </PlantProvider>
  );
}

export default PrivateRoutes;
