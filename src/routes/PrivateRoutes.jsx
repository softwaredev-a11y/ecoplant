import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardIndexPage from "../pages/DashboardIndexPage";
import PlantDetailsPage from "../pages/informationplant/PlantDetailsPage";
import NotFoundPage from "../pages/NotFoundPage";
import { PlantProvider } from "../context/PlantContext";
import { UserProvider } from "../context/UserInfoContext";
import ProtectedRoute from "./ProtectedRoute";

const ProtectedProvidersLayout = () => (
  <PlantProvider>
    <UserProvider>
      <Outlet />
    </UserProvider>
  </PlantProvider>
);

function PrivateRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedProvidersLayout />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardIndexPage />} />
            <Route path="planta/:idPlanta" element={<PlantDetailsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default PrivateRoutes;
