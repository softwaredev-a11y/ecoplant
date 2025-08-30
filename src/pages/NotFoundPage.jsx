import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

/**
 * Componente de la página de información no encontrada.
 * Define la estructura visual de la página, informando al usuario de que la información no se encontró.
 * @returns {JSX.Element} La página de información no encontrada.
 */
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center text-gray-600 bg-[#F7F7F7]">
      <AlertTriangle className="w-20 h-20 mb-4 text-yellow-500" />
      <h1 className="text-4xl font-bold mb-2">404 - Página No Encontrada</h1>
      <p className="mb-6 text-lg">Lo sentimos, la página que buscas no existe.</p>
      <Link to="/dashboard" className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
        Volver al Inicio
      </Link>
    </div>
  );
}

export default NotFoundPage;

