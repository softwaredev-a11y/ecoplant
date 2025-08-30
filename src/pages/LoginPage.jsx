import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import Error from "../components/ErrorMessage";
import logoImage from '../assets/images/logo.png';

/**
 * Componente de la página de inicio de sesión.
 * Define la estructura visual de la página, incluyendo el fondo, el logo y el contenedor del formulario.
 * @returns {JSX.Element} La página de inicio de sesión completa.
 */
function LoginPage() {

    return (
        <div className="main-container w-full flex flex-col justify-center items-center min-h-screen p-4 bg-gray-100 gap-6">
            <Logo url={logoImage} className="max-w-[220px] sm:max-w-[300px]" />
            <div className="login-container w-full max-w-md flex flex-col items-center bg-white shadow-lg rounded-xl p-6 sm:p-8 md:p-10">
                <FormLogin />
            </div>
        </div>
    );
}

/**
 * Componente que gestiona el formulario de inicio de sesión.
 * Encapsula el estado de los inputs, la gestión de errores y la lógica de envío del formulario.
 * @returns {JSX.Element} El formulario de inicio de sesión con su lógica interna.
 */
function FormLogin() {
    const [error, setError] = useState(null);
    const [dataForm, setDataForm] = useState({ username: '', password: '' });
    const navigate = useNavigate();

    /**
     * Maneja los cambios en los campos del formulario y actualiza el estado.
     * @param {React.ChangeEvent<HTMLInputElement>} e - El evento del cambio.
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setDataForm({ ...dataForm, [name]: value });
    };

    /**
     * Maneja el envío del formulario.
     * Previene el comportamiento por defecto y simula una llamada de autenticación.
     * @param {React.FormEvent<HTMLFormElement>} e - El evento de envío del formulario.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        // --- Simulación de Login ---
        // En una aplicación real, aquí se haría una llamada a una API para autenticar.
        if (dataForm.username === "admin@test.com" && dataForm.password === "123456") {
            setError(null); // Limpiar error si las credenciales son correctas.
            navigate("/dashboard"); // Redirigir al dashboard.
        } else {
            setError("Email y/o contraseña incorrectos.");
        }
    };

    return (
        <div className="form-container w-full flex flex-col gap-6">
            {/* Header del formulario */}
            <div className="form-header flex flex-col gap-1.5 text-left">
                <span className="font-bold text-gray-600 text-2xl">Iniciar sesión</span>
                <span className="text-gray-600 text-sm sm:text-md">Bienvenido de vuelta. Ingresa a tu cuenta</span>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
                <label htmlFor="username-input" className="font-semibold flex flex-col gap-1.5 text-sm text-gray-600">
                    Email
                    <input
                        required
                        type="email"
                        id="username-input"
                        name="username"
                        value={dataForm.username}
                        onChange={handleChange}
                        className="font-normal border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-gray-600"
                    />
                </label>
                <label htmlFor="password-input" className="font-semibold flex flex-col gap-1.5 text-sm text-gray-600">
                    Contraseña
                    <input
                        required
                        type="password"
                        id="password-input"
                        name="password"
                        value={dataForm.password}
                        onChange={handleChange}
                        className="font-normal border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-gray-600"
                    />
                </label>
                {/* Muestra el componente de error si existe un mensaje en el estado 'error' */}
                {error && <Error errorMessage={error} />}
                <button
                    type="submit"
                    className="w-full p-3 bg-green-600 text-white rounded-md font-semibold text-sm hover:bg-green-800 transition-colors duration-200 cursor-pointer">
                    Ingresar
                </button>
            </form>
        </div>
    );
}

export default LoginPage;