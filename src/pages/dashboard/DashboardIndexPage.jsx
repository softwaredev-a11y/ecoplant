import { LayoutDashboard } from "lucide-react";
/**
 * Página de bienvenida que se muestra en el dashboard.
 * Muestra al usuario un mensaje de bienvenida, antes de realizar cualquier acción.
 * @returns {JSX.Element} La página de bienvenida completa.
 */
function DashboardIndexPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <LayoutDashboard className="w-16 h-16 mb-4" />
            <h2 className="text-xl font-semibold">Bienvenido a tu Dashboard</h2>
            <p>Selecciona una planta del panel izquierdo para ver sus detalles.</p>
        </div>
    );
}

export default DashboardIndexPage;
