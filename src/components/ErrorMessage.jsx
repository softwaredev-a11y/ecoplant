/**
 * Componente reutilizable para mostrar un mensaje de error.
 * @param {{ errorMessage: string }} props - Propiedades del componente.
 * @param {string} props.errorMessage - El mensaje de error a mostrar.
 * @returns {JSX.Element} Un div que contiene el mensaje de error formateado.
 */
function Error({ errorMessage }) {
    return (
        <div className=" flex justify-center">
            <p className="font-semibold text-red-700 break-words">{errorMessage}</p>
        </div>
    )
}

export default Error;