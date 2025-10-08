import Logo from "@/components/Logo";
import logoImage from '@/assets/images/logo.webp';
import searchIcon from '@/assets/icons/search.svg'
import { Outlet, useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { getPlantModel } from "@/utils/syrusUtils";
import { usePlants } from "@/hooks/usePlants";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { Toaster } from "@/components/ui/sonner"
import { useLogout } from "@/hooks/useSessionTimeout";
import { Menu, X } from 'lucide-react';
import { ERROR_MESSAGES } from '../utils/constants'
import { useSearchPlant } from "../hooks/useSearchPlant";

/**
 * Componente principal del layout del Dashboard.
 * Gestiona el estado del panel lateral (para vistas móviles), y la sesión del usuario
 * (validación de token, renovación automática y cierre de sesión).
 * @returns {JSX.Element} El layout completo del dashboard.
 */
function DashboardLayout() {
    const [isOpen, setIsOpen] = useState(false);
    const toggleMenu = () => setIsOpen(!isOpen);

    // Hook para gestionar el cierre de sesión automático y al cerrar el navegador.
    useLogout();

    return (
        <div className="main-container flex flex-col w-[98%] min-h-[95dvh] md:min-h-[90dvh] max-h-[95vh] md:max-h-[90dvh] box-border border bg-white border-[#ccc] p-0">
            <Toaster position="top-center" richColors closeButton toastOptions={{ unstyled: false }}
                style={{
                    '--error-bg': 'oklch(1 0 0)',
                    '--error-border': 'var(--destructive)',
                    '--error-text': 'var(--destructive)',
                    '--normal-bg-hover': 'hsl(0 0% 100%)',
                }}
            />
            <Header toggleMenu={toggleMenu} />
            <MainLayout isOpen={isOpen} toggleMenu={toggleMenu} />
        </div>
    );
}


/**
 * Renderiza la cabecera del dashboard.
 * Incluye el logo, el botón de menú para móviles y los botones de acción (accesos, control, resumén y cierre de sesión).
 * @param {object} props - Propiedades del componente.
 * @param {() => void} props.toggleMenu - Función para alternar la visibilidad del menú lateral en vistas móviles.
 * @returns {JSX.Element}
 */
function Header({ toggleMenu }) {
    const { logout } = useAuth();
    const { isSuperUser } = useUsers();
    return (
        <div className="header flex justify-between bg-white p-1 items-center">
            {/* Contenedor izquierdo: Hamburguesa + Logo */}
            <div className="left-options flex items-center gap-3">
                {/* Botón hamburguesa solo visible en móviles/tablets */}
                <button className="block lg:hidden" onClick={toggleMenu}>
                    <Menu color="#005596" />
                </button>
                {/* Logo solo visible en pantallas grandes */}
                <Logo url={logoImage} className="w-[200px] h-auto ml-2 hidden lg:block" />
            </div>

            {/* Contenedor de botones */}
            <div className="righ-options flex overflow-x-auto  w-full justify-center  lg:w-auto lg:justify-start">
                <button disabled={!isSuperUser} className="py-1.5 px-3 border-0 bg-white rounded text-sm md:text-base cursor-pointer font-bold text-neutral-600 hover:border hover:border-gray-300 hover:rounded-md disabled:cursor-not-allowed">Historial de accesos</button>
                <button disabled={!isSuperUser} className="py-1.5 px-3 border-0 bg-white rounded text-sm md:text-base cursor-pointer font-bold text-neutral-600 hover:border hover:border-gray-300 hover:rounded-md disabled:cursor-not-allowed">Diagnóstico</button>
                <button disabled={!isSuperUser} className="py-1.5 px-3 border-0 bg-white rounded text-sm md:text-base cursor-pointer font-bold text-neutral-600 hover:border hover:border-gray-300 hover:rounded-md disabled:cursor-not-allowed">Control</button>
                <button onClick={logout} className="py-1.5 px-3 border-0 bg-white rounded text-sm md:text-base cursor-pointer font-bold text-neutral-600 hover:border hover:border-gray-300 hover:rounded-md">Cerrar sesión</button>
            </div>
        </div>
    );
}


/**
 * Componente que organiza el área principal del layout.
 * Contiene el panel izquierdo (menú) y el panel de contenido principal.
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Estado que indica si el panel lateral está abierto.
 * @param {() => void} props.toggleMenu - Función para alternar la visibilidad del panel lateral.
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
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Estado que indica si el panel está abierto en vistas móviles.
 * @param {() => void} props.toggleMenu - Función para cerrar el panel en vistas móviles.
 * @returns {JSX.Element}
 */
function PanelLeft({ isOpen, toggleMenu }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [numberPlants, setNumberPlants] = useState(0);
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
                <Logo url={logoImage} className="w-[200px] h-auto ml-2" />
                <button onClick={toggleMenu} className="text-[#004275] hover:text-black text-2xl font-bold">
                    <X color="#005596" />
                </button>
            </div>
            <InputSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} numberPlants={numberPlants} />
            <PanelLeftItems searchTerm={searchTerm} toggleMenu={toggleMenu} isOpen={isOpen} setNumberPlants={setNumberPlants} />
            <FilterBar />
        </div>
    );
}

/**
 * Componente de búsqueda para el panel izquierdo.
 * @param {object} props - Propiedades del componente.
 * @param {string} props.searchTerm - El término de búsqueda actual.
 * @param {(value: string) => void} props.setSearchTerm - Función para actualizar el término de búsqueda.
 * @param {number} props.numberPlants - El número de plantas que se están mostrando.
 * @returns {JSX.Element}
 */
function InputSearch({ searchTerm, setSearchTerm, numberPlants }) {
    return (
        <div className="search-container flex justify-between items-center p-2">
            <img src={searchIcon} alt="Ícono de búsqueda" className="max-w-[30px]" />
            <input type="search"
                name="searchTerm"
                id="searchTerm"
                value={searchTerm}
                placeholder={numberPlants === 0 ? `Buscar Ecoplanta` : numberPlants === 1 ? `Buscar ${numberPlants} Ecoplanta` : `Buscar ${numberPlants} Ecoplantas`}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[90%] h-10 border-0 p-[0.2rem] border-b border-gray-300 mb-[0.3rem] font-normal text-gray-600 focus:outline-none focus:border-b focus:border-gray-300"
            />
        </div>
    )
}

/**
 * Renderiza la lista de items (plantas) en el panel izquierdo.
 * @param {object} props - Propiedades del componente.
 * @param {string} props.searchTerm - Término de búsqueda para filtrar las plantas.
 * @param {() => void} props.toggleMenu - Función para cerrar el menú al navegar (en móvil).
 * @param {boolean} props.isOpen - Estado que indica si el panel está abierto.
 * @param {(count: number) => void} props.setNumberPlants - Función para actualizar el contador de plantas mostradas.
 * @returns {JSX.Element}
 */
function PanelLeftItems({ searchTerm, toggleMenu, isOpen, setNumberPlants }) {
    const { plants, isLoading } = usePlants();
    const { filteredPlants, numberPlants } = useSearchPlant(plants, searchTerm);

    useEffect(() => {
        setNumberPlants(numberPlants);
    }, [numberPlants, setNumberPlants]);

    const navigate = useNavigate();
    const handleNavigate = (idPlanta) => {
        navigate(`planta/${idPlanta}`);
        if (isOpen) {
            toggleMenu();
        }
    };

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
                    {isLoading ? "Cargando Ecoplantas." : ERROR_MESSAGES.COMMUNICATION_PROBLEMS}
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
                <p className="text-gray-600 font-bold">Powered by: ecoplant.com.co</p>
            </div>
        </div>
    )
}


export default DashboardLayout;