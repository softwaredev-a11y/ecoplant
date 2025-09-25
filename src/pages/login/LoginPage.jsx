import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";
import Error from "@/components/ErrorMessage";
import logoImage from '@/assets/images/logo.webp';

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
    //Los datos utilizados son los requeridos para obtener el token de sesión. Obtiene un token de 6 horas. 
    const [dataForm, setDataForm] = useState({ username: '', password: '', scheme: "finite", limit: 21600 });
    const { isLoadingLogin, login } = useAuth();

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
     * Previene el comportamiento por defecto y realiza una llamada de autenticación.
     * @param {React.FormEvent<HTMLFormElement>} event - El evento de envío del formulario.
     */
    async function authUser(event) {
        event.preventDefault();
        try {
            await login(dataForm);
        } catch (err) {
            if (err.response?.status === 401) {
                setError('Email y/o contraseña incorrectos.');
            }
        }
    }
    return (
        <div className="form-container w-full flex flex-col gap-6">
            {/* Header del formulario */}
            <div className="form-header flex flex-col gap-1.5 text-left">
                <span className="font-bold text-gray-600 text-2xl">Iniciar sesión</span>
                <span className="text-gray-600 text-sm sm:text-md">Bienvenido. Ingrese a su cuenta</span>
            </div>

            {/* Formulario */}
            <form onSubmit={authUser} className="flex flex-col gap-6 flex-1">
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
                <button disabled={isLoadingLogin}
                    type="submit"
                    className="disabled:cursor-not-allowed w-full p-3 bg-green-600 text-white rounded-md font-semibold text-sm hover:bg-green-800 transition-colors duration-200 cursor-pointer">
                    {isLoadingLogin ? "Iniciando sesión" : "Ingresar"}
                </button>
            </form>
        </div>
    );
}

export default LoginPage;