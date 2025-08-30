import Logo from "../components/Logo";
import logoImage from '../assets/images/logo-here.png';
import searchIcon from '../assets/icons/search.svg'
import notAvailableImg from '../assets/images/image-not-available.jpg'
import { useState } from "react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"





function DashboardPage() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <div className="main-container flex flex-col md:flex-col  w-[98%] min-h-[90vh] max-h-[90vh] box-border border bg-white border-[#ccc] p-0 md:p-0">
            <Header toggleMenu={toggleMenu} />
            <MainLayout isOpen={isOpen} toggleMenu={toggleMenu} />
        </div>
    );
}


function Header({ toggleMenu }) {
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
                <button className="py-2 px-4 border-0 bg-white rounded text-base cursor-pointer font-bold text-neutral-600 hover:border hover:border-gray-300 hover:rounded-md">[Botón]</button>
                <button className="py-2 px-4 border-0 bg-white rounded text-base cursor-pointer font-bold text-neutral-600 hover:border hover:border-gray-300 hover:rounded-md">[Botón]</button>
                <button className="py-2 px-4 border-0 bg-white rounded text-base cursor-pointer font-bold text-neutral-600 hover:border hover:border-gray-300 hover:rounded-md">[Botón]</button>
            </div>
        </div>
    );
}


function MainLayout({ isOpen, toggleMenu }) {
    return (
        <div className="flex flex-1 min-h-0 h-full border-t border-[#ccc] gap-4">
            <PanelLeft isOpen={isOpen} toggleMenu={toggleMenu} />
            <ContentPanel />
        </div>
    );
}

function PanelLeft({ isOpen, toggleMenu }) {
    return (
        <div
            className={`panel-left-container bg-white flex flex-col min-h-0 transition-transform duration-300 ease-in-out
        w-[95vw] max-w-[95vw] px-2 py-5 fixed top-0 left-0 h-full
        md:w-[80vw] md:max-w-[320px] md:min-w-[180px]
        lg:static lg:w-[34%] lg:max-w-[260px] lg:px-1 lg:py-0 lg:h-auto
        xl:w-[400px] xl:max-w-[400px]
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
            {/* Botón de cierre, solo visible en móvil/tablet */}
            <div className="flex justify-between lg:hidden mb-4">

                <Logo url={logoImage} className="w-[100px] h-auto" />
                <button
                    onClick={toggleMenu}
                    className="text-[#004275] hover:text-black text-2xl font-bold"
                >
                    ✕
                </button>
            </div>

            <InputSearch />
            <PanelLeftItems />
            <FilterBar />
        </div>
    );
}


function InputSearch() {
    return (
        <div className="search-container flex justify-between items-center p-2">
            <img
                src={searchIcon}
                alt="Ícono de búsqueda"
                className="max-w-[30px]"
            />
            <input type="search"
                name=""
                id=""
                placeholder="[Realizar Búsqueda]"
                className="w-[90%] h-10 border-0 p-[0.2rem] border-b border-gray-300 mb-[0.3rem] font-normal text-gray-600 focus:outline-none focus:border-b focus:border-gray-300"
            />
        </div>
    )
}

function PanelLeftItems() {
    const items = [];
    for (let i = 0; i < 10; i++) {
        items.push(
            <Tooltip key={i}>
                <TooltipTrigger className="break-all text-start cursor-pointer bg-white p-[0.4rem] border-0 border-b border-gray-300 mb-[0.3rem] text-neutral-600 hover:border hover:border-gray-300 hover:bg-gray-300 hover:rounded-sm">
                    <strong>[Nombre de la planta {i + 1}]</strong> <br /> [Modelo]  <br />  [Imei]
                </TooltipTrigger>
                <TooltipContent>
                    <p>[Íconos u otra información]</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <div className="menu-items flex-1 flex flex-col p-2 gap-1 overflow-auto min-h-0 max-h-[85%]">
            {items}
        </div>
    )
}

function FilterBar() {
    return (
        <div className="mt-auto mb-1 border border-[#ccc] flex justify-center w-[98%] ml-auto">
            <p className="text-gray-600">[Filtros]</p>
        </div>
    )
}

function ContentPanel() {
    {/**Contenedor en donde se carga toda la información. */ }
    return (
        <div className="flex-1 bg-white flex flex-col min-h-0 max-h-full border-l border-[#ccc] w-full m-0 p-[0.7rem] md:p-4 md:min-h-screen md:w-full lg:w-[66%] lg:p-[1.2rem] xl:p-0 xl:min-h-[100%] xl:max-h-[100%]">
            <InfoPanels />
        </div>
    )
}


function InfoPanels() {
    {/**Contenedor en donde se cargan los 3 paneles de información */ }
    return (
        <div className="info-container flex flex-col p-4 overflow-y-auto">
            <h3 className="text-[#525252] font-bold mb-2 text-2xl">[Nombre de la planta]</h3>
            <div className="info-containers gap-4 grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(450px,1fr))]">
                <DescriptionPanel />
                <OperationsPanel />
                <AcummulatedPanel />
            </div>

        </div>
    )
}

function DescriptionPanel() {
    {/**Contenedor donde se carga la información de la planta. */ }
    const descriptionData = [
        [ // Primer grupo
            { label: '[Ítem]', value: '[Valor]' },
            { label: '[Ítem]', value: '[Valor]' },
        ],
        [ // Segundo grupo
            { label: '[Ítem]', value: '[Valor]' },
            { label: '[Ítem]', value: '[Valor]' },
            { label: '[Ítem]', value: '[Valor]' },
        ],
        [ // Tercer grupo
            { label: '[Ítem]', value: '[Valor]' },
            { label: '[Ítem]', value: '[Valor]' },
        ],
    ];
    return (
        <div className="description-container flex flex-col border border-[#ccc] mb-4 p-0  overflow-y-auto">
            <HeaderPanel title={"[Título Panel 1]"} />
            <div>
                <img src={notAvailableImg} alt="" className="w-3/5 max-w-[250px] h-auto block object-contain my-4 mx-auto" />
            </div>
            <InfoPanel itemGroups={descriptionData} />

        </div>
    )
}


function OperationsPanel() {

    return (
        <div className="operations-container  flex flex-col border border-[#ccc] mb-4 p overflow-y-auto">
            <HeaderPanel title={"[Título Panel 2]"} />
            <div className="flex flex-col gap-6">
                <div>
                    < Operations typeOperation={"[Acción]"} buttonOperation={"[Realizar Acción]"} />
                    < Operations typeOperation={"[Acción]"} buttonOperation={"[Realizar Acción]"} />
                    < Operations typeOperation={"[Acción]"} buttonOperation={"[Realizar Acción]"} />
                </div>
                <div>
                    < Operations typeOperation={"[Acción]"} buttonOperation={"[Realizar Acción]"} />
                    < Operations typeOperation={"[Acción]"} buttonOperation={"[Realizar Acción]"} />
                </div>
            </div>
        </div>
    )
}

function AccumulatedRow({ label, value, showButton, buttonText = "[Button]", showValue = true }) {
    const valueClassName = `font-normal text-gray-600 text-sm md:text-base lg:text-base ${!showValue ? 'hidden' : ''}`.trim();

    return (
        <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation grid grid-cols-[70px_85px_1fr] items-center gap-1.5">
            {label}:
            <span className={valueClassName}> {value} </span>
            {showButton && (
                <button className="p-1 border-0 bg-[#004275] rounded-sm text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide">
                    {buttonText}
                </button>
            )}
        </span>
    );
}

function AcummulatedPanel() {
    const accumulatedData = [
        [ // Primer grupo
            { id: '1a', label: '[Ítem]', value: '[Value]', showButton: true, showValue: false, buttonText: '[Button]' },
            { id: '1b', label: '[Ítem]', value: '[Value]', showButton: false, showValue: true },
        ],
        [ // Segundo grupo
            { id: '2a', label: '[Ítem]', value: '[Value]', showButton: true, showValue: false, buttonText: '[Button]' },
            { id: '2b', label: '[Ítem]', value: '[Value]', showButton: false, showValue: true },
        ],
        [ // Tercer grupo
            { id: '3a', label: '[Ítem]', value: '[Value]', showButton: true, showValue: false, buttonText: '[Button]' },
            { id: '3b', label: '[Ítem]', value: '[Value]', showButton: false, showValue: true },
        ],
        [ // Cuarto grupo (solo una fila, con valor oculto y sin botón)
            { id: '4a', label: '[Ítem]', value: '[Value]', showButton: false, showValue: true },
        ]
    ];

    return (
        <div className="months-container flex flex-col border border-[#ccc] mb-4 p-0 overflow-y-auto">
            <HeaderPanel title={"[Título Panel 3]"} />
            <div className="items-panel flex flex-col p-1.5 gap-8">
                {accumulatedData.map((group, groupIndex) => (
                    <div key={groupIndex} className="flex flex-col gap-1.5">
                        {group.map(item => (
                            <AccumulatedRow
                                key={item.id}
                                label={item.label}
                                value={item.value}
                                showButton={item.showButton}
                                buttonText={item.buttonText}
                                showValue={item.showValue}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}



function HeaderPanel({ title }) {
    return (
        <div className="header-info w-full bg-[#005596] min-h-[30px] flex justify-center items-center tracking-wide">
            <span className="text-[#fff] font-semibold">{title}</span>
        </div>
    )
}

function InfoPanel({ itemGroups }) {
    if (!itemGroups || itemGroups.length === 0) {
        return null;
    }
    return (
        <div className="items-panel flex flex-col p-1.5 gap-4">
            {itemGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="flex flex-col gap-1.5">
                    {group.map((item, itemIndex) => (
                        <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base" key={`${groupIndex}-${itemIndex}`}>
                            {item.label}: <span className="font-normal text-gray-600  text-sm md:text-base lg:text-base">{item.value}</span>
                        </span>
                    ))}
                </div>
            ))}
        </div>
    );
}


function Operations({ typeOperation, buttonOperation }) {
    return (
        <div className="flex flex-col gap-1 p-1">
            <span className="text-gray-600 font-semibold mr-1.5 break-words  text-sm md:text-base lg:text-base">{typeOperation}: <span className="font-normal text-gray-600  text-sm md:text-base lg:text-base">[Value]</span></span>
            <div className="item-operation  grid grid-cols-[70px_85px_1fr] gap-1.5">
                <input type="number" name="" id="" className="border border-[#ccc]  text-sm p-0.5 text-gray-600 rounded-sm " />
                <select name="" id="" className="border border-[#ccc]  text-sm p-0.5 text-gray-600 rounded-sm">
                    <option value=""></option>
                    <option value="seconds">Segundos</option>
                    <option value="minutes">Minutos</option>
                    <option value="hours">Horas</option>
                </select>
                <AlertDialog>
                    <AlertDialogTrigger className="p-1.5 border-0 bg-[#004275] rounded-sm  text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide">{buttonOperation}</AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-sm text-gray-600 font-semibold tracking-wide">¿Está seguro de realizar esta acción?</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-gray-600" >
                                Se cambiará el parámetro de <span className="text-red-700 font-bold">{typeOperation}</span> al valor <span className="text-red-700 font-bold">[Nuevos Valores]</span>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="cursor-pointer bg-[#004275] hover:bg-[#0076D1]">Continuar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </div>
        </ div>
    )
}


export default DashboardPage;