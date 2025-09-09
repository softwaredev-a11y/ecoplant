import Logo from "../components/Logo";
import logoImage from '../assets/images/logo.webp';
import searchIcon from '../assets/icons/search.svg'
import { Outlet, useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react";
import { getPlantModel } from "../utils/plantUtils";
import { usePlants } from "../hooks/usePlants";
import { useAuth } from "../hooks/useAuth";


/**
 * Componente principal del layout del Dashboard.
 * Gestiona el estado del panel lateral móvil y renderiza el Header y el MainLayout.
 * @returns {JSX.Element} El layout completo del dashboard.
 */
function DashboardLayout() {
    const [isOpen, setIsOpen] = useState(false);
    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <div className="main-container flex flex-col md:flex-col  w-[98%] min-h-[90vh] max-h-[90vh] box-border border bg-white border-[#ccc] p-0 md:p-0">
            <Header toggleMenu={toggleMenu} />
            <MainLayout isOpen={isOpen} toggleMenu={toggleMenu} />
        </div>
    );
}


/**
 * Renderiza la cabecera del dashboard.
 * Incluye el logo, el botón de menú para móviles y los botones de acción.
 * @param {{ toggleMenu: () => void }} props - Props del componente.
 * @returns {JSX.Element}
 */
function Header({ toggleMenu }) {
    const { logout } = useAuth();
    return (
        <div className="header flex justify-between bg-white p-2 items-center">
            {/* Contenedor izquierdo: Hamburguesa + Logo */}
            <div className="left-options flex items-center gap-3">
                {/* Botón hamburguesa solo visible en móviles/tablets */}
                <button className="block lg:hidden" onClick={toggleMenu}>
                    <span className="w-6 h-0.5 bg-[#005596] block mb-1"></span>
                    <span className="w-6 h-0.5 bg-[#005596] block mb-1"></span>
                    <span className="w-6 h-0.5 bg-[#005596] block"></span>
                </button>

                {/* Logo solo visible en pantallas grandes */}
                <Logo url={logoImage} className="w-[200px] h-auto mr-2.5 hidden lg:block" />
            </div>

            {/* Contenedor de botones */}
            <div className="righ-options flex overflow-x-auto 
                      w-full justify-center 
                      lg:w-auto lg:justify-start">
                <button className="py-2 px-4 border-0 bg-white rounded text-base cursor-pointer font-bold text-neutral-600 hover:border hover:border-gray-300 hover:rounded-md">Historial de accesos</button>
                <button className="py-2 px-4 border-0 bg-white rounded text-base cursor-pointer font-bold text-neutral-600 hover:border hover:border-gray-300 hover:rounded-md">Diagnóstico</button>
                <button onClick={logout} className="py-2 px-4 border-0 bg-white rounded text-base cursor-pointer font-bold text-neutral-600 hover:border hover:border-gray-300 hover:rounded-md">Cerrar sesión</button>
            </div>
        </div>
    );
}


/**
 * Componente que organiza el área principal del layout.
 * Contiene el panel izquierdo (menú) y el panel de contenido principal.
 * @param {{ isOpen: boolean, toggleMenu: () => void }} props - Props del componente.
 * @returns {JSX.Element}
 */
function MainLayout({ isOpen, toggleMenu }) {
    return (
        <div className="flex flex-1 min-h-0 h-full border-t border-[#ccc] gap-4">
            <PanelLeft isOpen={isOpen} toggleMenu={toggleMenu} />
            <ContentPanel />
        </div>
    );
}

/**
 * Panel lateral izquierdo que contiene la navegación y filtros.
 * Es estático en pantallas grandes y un menú deslizable en móviles/tablets.
 * @param {{ isOpen: boolean, toggleMenu: () => void }} props - Props del componente.
 * @returns {JSX.Element}
 */
function PanelLeft({ isOpen, toggleMenu }) {
    const [searchTerm, setSearchTerm] = useState('');
    return (
        <div
            className={`panel-left-container bg-white flex flex-col min-h-0 transition-transform duration-300 ease-in-out
        {/* Posicionamiento y visibilidad para móvil/tablet */}
        w-[95vw] max-w-[95vw] px-2 py-5 fixed top-0 left-0 h-full
        md:w-[80vw] md:max-w-[320px] md:min-w-[180px]
        {/* Posicionamiento y visibilidad para desktop */}
        lg:static lg:w-[34%] lg:max-w-[260px] lg:px-1 lg:py-0 lg:h-auto
        xl:w-[400px] xl:max-w-[400px]
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
            {/* Botón de cierre, solo visible en móvil/tablet */}
            <div className="flex justify-between lg:hidden mb-4">
                <Logo url={logoImage} className="w-[200px] h-auto" />
                <button onClick={toggleMenu} className="text-[#004275] hover:text-black text-2xl font-bold">
                    ✕
                </button>
            </div>
            <InputSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <PanelLeftItems searchTerm={searchTerm} />
            <FilterBar />
        </div>
    );
}

/**
 * Componente de búsqueda para el panel izquierdo.
 * @returns {JSX.Element}
 */
function InputSearch({ searchTerm, setSearchTerm }) {
    return (
        <div className="search-container flex justify-between items-center p-2">
            <img src={searchIcon} alt="Ícono de búsqueda" className="max-w-[30px]" />
            <input type="search"
                name="searchTerm"
                id="searchTerm"
                value={searchTerm}
                placeholder="Buscar Ecoplanta"
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[90%] h-10 border-0 p-[0.2rem] border-b border-gray-300 mb-[0.3rem] font-normal text-gray-600 focus:outline-none focus:border-b focus:border-gray-300"
            />
        </div>
    )
}

/**
 * Renderiza la lista de items (plantas) en el panel izquierdo.
 * @returns {JSX.Element}
 */
function PanelLeftItems({ searchTerm }) {
    const { plants } = usePlants();
    const navigate = useNavigate();
    const handleNavigate = (idPlanta) => {
        navigate(`planta/${idPlanta}`);
    };
    const filteredPlants = plants.filter((plant) =>
        plant.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="menu-items flex-1 flex flex-col p-2 gap-1 overflow-auto min-h-0 max-h-[85%]">
            {filteredPlants.length > 0 ? (
                filteredPlants.map((plant) => (
                    <Tooltip key={plant.id}>
                        <TooltipTrigger
                            onClick={() => handleNavigate(plant.id)}
                            className="break-all text-start cursor-pointer bg-white p-[0.4rem] border-0 border-b border-gray-300 mb-[0.3rem] text-neutral-600 hover:border hover:border-gray-300 hover:bg-gray-300 hover:rounded-sm"
                        >
                            <strong>{plant.name}</strong> <br />
                            Modelo: {getPlantModel(plant.info.description)} <br />
                            Imei: {plant.device}
                        </TooltipTrigger>
                        <TooltipContent className="hidden" >
                            <p>[Íconos u otra información]</p>
                        </TooltipContent>
                    </Tooltip>
                ))
            ) : (
                <p className="text-center text-gray-500 mt-4">
                    No se encontraron resultados.
                </p>
            )}
        </div>
    );
}

/**
 * Barra de filtros en la parte inferior del panel izquierdo.
 * @returns {JSX.Element}
 */
function FilterBar() {
    return (
        <div className="mt-auto mb-1 border border-[#ccc] hidden justify-center w-[98%] ml-auto">
            <p className="text-gray-600">[Filtros]</p>
        </div>
    )
}

/**
 * Panel principal de contenido que renderiza las rutas anidadas.
 * @returns {JSX.Element}
 */
function ContentPanel() {
    return (
        <div className="flex-1 bg-white flex flex-col  min-h-0 max-h-full border-l border-[#ccc] w-full m-0 p-[0.7rem] md:p-4 md:w-full lg:w-[66%] lg:p-[1.2rem] xl:p-0 xl:min-h-[100%] xl:max-h-[100%]">
            <Outlet />
            <div className="p-0.5 flex flex-row justify-center">
                <p className="text-gray-600 font-bold">Powered by: Ecoplant</p>
            </div>
        </div>
    )
}


export default DashboardLayout;