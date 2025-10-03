import { LayoutDashboard } from "lucide-react";
/**
 * Página de bienvenida que se muestra en el dashboard.
 * Muestra al usuario un mensaje de bienvenida, antes de realizar cualquier acción.
 * @returns {JSX.Element} La página de bienvenida completa.
 */
function DashboardIndexPage() {
    return (
        <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-500 px-4 py-8">
            <LayoutDashboard className="w-16 h-16 mb-4 md:w-20 md:h-20" />
            <h2 className="text-lg font-semibold sm:text-xl md:text-2xl">Bienvenido a tu Dashboard </h2>
            <p className="mt-2 text-sm sm:text-base md:text-lg max-w-md"> Selecciona una planta del panel izquierdo para ver sus detalles.</p>
        </div>
    );
}

export default DashboardIndexPage;
