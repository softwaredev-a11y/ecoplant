/**
 * Componente reutilizable para mostrar un mensaje de error.
 * @param {object} props - Propiedades del componente.
 * @param {string} props.message - El mensaje de errorr a mostrar.
 * @returns {JSX.Element} El elemento de que muestra mensaje de error.
 */
export default function StatusMessage({ message }) {
    return (
        <p className="text-neutral-600  mb-2">
            {message}
        </p>
    )
}