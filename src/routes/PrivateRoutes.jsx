import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardIndexPage from "../pages/DashboardIndexPage";
import PlantDetailsPage from  "../pages/informationplant/PlantDetailsPage";
import NotFoundPage from "../pages/NotFoundPage";
import { PlantProvider } from "../context/PlantContext";
import { UserProvider } from "../context/UserInfoContext";

function PrivateRoutes() {
  return (
    <PlantProvider>
      <UserProvider>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardIndexPage />} />
            <Route path="planta/:idPlanta" element={<PlantDetailsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </UserProvider>
    </PlantProvider>
  );
}

export default PrivateRoutes;
