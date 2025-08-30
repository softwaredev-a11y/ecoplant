/**
 * Componente reutilizable para mostrar un logo.
 * @param {object} props - Propiedades del componente.
 * @param {string} props.url - La URL de la imagen del logo.
 * @param {string} props.className - Las clases de CSS para aplicar al logo.
 * @returns {JSX.Element} El elemento de la imagen del logo.
 */
function Logo({url, className}) {
    return (
        <img src={url} alt="Logo de la empresa." className={className} />
    )
}

export default Logo;