import { Navigate, Outlet } from 'react-router-dom'

/**
 * Componente que actúa como una barrera de protección para rutas privadas.
 * Verifica si existe un token de autenticación en `sessionStorage`.
 * - Si el token existe, renderiza las rutas hijas anidadas (`<Outlet />`).
 * - Si el token no existe, redirige al usuario a la ruta raíz (`/`), que el login.
 * @returns {JSX.Element} Renderiza el contenido de la ruta hija o un componente de redirección.
 */
const ProtectedRoute = () => {
    const token = sessionStorage.getItem("token")
    return (
        token ?
            <Outlet /> : <Navigate to="/" replace />
    )
}

export default ProtectedRoute;