import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = () => {
    const token = sessionStorage.getItem("token")
    return (
        token ?
            <Outlet /> : <Navigate to="/" replace />
    )
}

export default ProtectedRoute;