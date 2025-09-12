/**
 * Componente que renderiza la cabecera para los paneles de información.
 * @param {object} props - Las propiedades del componente.
 * @param {string} props.title - El título que se mostrará en la cabecera.
 * @returns {JSX.Element} El elemento JSX de la cabecera del panel.
 */
export default function HeaderPanel({ title }) {
    return (
        <div className="header-info w-full bg-[#005596] min-h-[30px] flex justify-center items-center tracking-wide">
            <span className="text-[#fff] font-semibold text-center">{title}</span>
        </div>
    )
}
