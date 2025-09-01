import { useState } from 'react';
import notAvailableImg from '../assets/images/image-not-available.jpg'

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


/**
 * Página principal que muestra los detalles de una planta.
 * Organiza y renderiza los paneles de descripción, operaciones y acumulados.
 * @returns {JSX.Element}
 */
function PlantDetailsPage() {
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

/**
 * Panel que muestra la descripción y una imagen de la planta.
 * @returns {JSX.Element}
 */
function DescriptionPanel() {
    const descriptionData = [
        [ // Primer grupo
            { label: 'Descripción', value: `` },
            { label: 'Versión del script', value: `` },
        ],
        [ // Segundo grupo
            { label: 'Estado de conectividad del celular', value: `` },
            { label: 'Estado del accesorio expansor', value: `` },
            { label: 'Estado del GPS', value: `` },
        ],
        [ // Tercer grupo
            { label: 'Proceso en ejecución actualmente', value: `` },
            { label: 'Flujo actual', value: `` },
        ],
    ];
    return (
        <div className="description-container flex flex-col border border-[#ccc] mb-4 p-0  overflow-y-auto">
            <HeaderPanel title={"Descripción"} />
            <div>
                <img src={notAvailableImg} alt="" className="w-3/5 max-w-[250px] h-auto block object-contain my-4 mx-auto" />
            </div>
            <InfoPanel itemGroups={descriptionData} />

        </div>
    )
}


/**
 * Panel que muestra las operaciones que se pueden realizar sobre la planta.
 * @returns {JSX.Element}
 */
function OperationsPanel() {

    return (
        <div className="operations-container  flex flex-col border border-[#ccc] mb-4 p overflow-y-auto">
            <HeaderPanel title={"Párametros de operación"} />
            <div className='flex flex-col p-3.5'>
                <div className="flex flex-col gap-6">
                    <div>
                        < Operations typeOperation={"Filtración"} currentlyValue={""} buttonOperation={"Cambiar filtración"} />
                        < Operations typeOperation={"Retrolavado"} currentlyValue={""} buttonOperation={"Cambiar retrolavado"} />
                        < Operations typeOperation={"Enjuague"} currentlyValue={""} buttonOperation={"Cambiar enjuague"} />
                    </div>
                    <div>
                        < Operations typeOperation={"Alerta de flujo disminuyendo"} currentlyValue={""} buttonOperation={"Cambiar umbral GPM"} />
                        < Operations typeOperation={"Alerta por flujo insuficiente"} currentlyValue={""} buttonOperation={"Cambiar umbral GPM"} />
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Componente reutilizable para mostrar una fila de datos en el panel de acumulados.
 * Puede mostrar condicionalmente un valor y/o un botón.
 * @param {{
 *   label: string,
 *   value: string,
 *   showButton: boolean,
 *   buttonText?: string,
 *   showValue?: boolean
 * }} props - Propiedades del componente.
 * @returns {JSX.Element}
 */
function AccumulatedRow({ label, value, showButton, buttonText = "[Button]", showValue = true }) {
    const valueClassName = `font-normal text-gray-600 text-sm md:text-base lg:text-base ${!showValue ? 'hidden' : ''}`.trim();

    return (
        <span className="item-panel break-words text-gray-600 font-semibold mr-1.5 text-sm md:text-base lg:text-base item-operation items-center gap-1.5">
            {label}:
            <span className={valueClassName}> {value} </span>
            {showButton && (
                <button className="p-0.5 border-0 bg-[#005596] rounded-sm text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide">
                    {buttonText}
                </button>
            )}
        </span>
    );
}

/**
 * Panel que muestra datos acumulados de la planta, agrupados por secciones.
 * @returns {JSX.Element}
 */
function AcummulatedPanel() {
    // Datos de ejemplo. En una aplicación real, esto vendría de props o una API.
    const accumulatedData = [
        [ // Primer grupo
            { id: '1a', label: 'Acumulado Filtración mes anterior', value: ``, showButton: true, showValue: false, buttonText: 'Consultar mes anterior' },
            { id: '1b', label: 'Acumulado Filtración mes actual', value: ``, showButton: false, showValue: true },
        ],
        [ // Segundo grupo
            { id: '2a', label: 'Acumulado Enjuague mes anterior', value: ``, showButton: true, showValue: false, buttonText: 'Consultar mes anterior' },
            { id: '2b', label: 'Acumulado Enjuague mes actual', value: ``, showButton: false, showValue: true },
        ],
        [ // Tercer grupo
            { id: '3a', label: 'Acumulado Retrolavado mes anterior', value: ``, showButton: true, showValue: false, buttonText: 'Consultar mes anterior' },
            { id: '3b', label: 'Acumulado Retrolavado mes actual', value: ``, showButton: false, showValue: true },
        ],
        [ // Cuarto grupo (solo una fila, con valor oculto y sin botón)
            { id: '4a', label: 'Acumulado Purgado mes actual', value: ``, showButton: false, showValue: true },
        ]
    ];

    return (
        <div className="months-container flex flex-col border border-[#ccc] mb-4 p-0 overflow-y-auto">
            <HeaderPanel title={"Acumulados del mes actual y mes anterior"} />
            <div className="items-panel flex flex-col p-3.5 gap-8">
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


/**
 * Componente genérico para la cabecera de un panel.
 * @param {{ title: string }} props - Propiedades del componente.
 * @returns {JSX.Element}
 */
function HeaderPanel({ title }) {
    return (
        <div className="header-info w-full bg-[#005596] min-h-[30px] flex justify-center items-center tracking-wide">
            <span className="text-[#fff] font-semibold">{title}</span>
        </div>
    )
}

/**
 * Componente genérico para mostrar grupos de pares etiqueta-valor.
 * @param {{ itemGroups: Array<Array<{label: string, value: string}>> }} props - Propiedades del componente.
 * @returns {JSX.Element | null}
 */
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


/**
 * Componente que representa una única operación realizable, con inputs y un diálogo de confirmación.
 * @param {{ typeOperation: string, buttonOperation: string }} props - Propiedades del componente.
 * @returns {JSX.Element}
 */
function Operations({ typeOperation, currentlyValue, buttonOperation }) {

    const [timeValue, setTimeValue] = useState("");
    const [timeUnit, setTimeUnit] = useState('none');
    const isButtonDisabled = !timeValue || timeUnit === 'none';


    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'timeValue') {
            setTimeValue(value);
        } else if (name === 'timeUnit') {
            setTimeUnit(value);
        }
    };
    return (
        <div className="flex flex-col gap-1 p-1">
            <span className="text-gray-600 font-semibold mr-1.5 break-words  text-sm md:text-base lg:text-base">{typeOperation}: <span className="font-normal text-gray-600  text-sm md:text-base lg:text-base">{currentlyValue}</span></span>
            <div className="item-operation  grid grid-cols-[70px_85px_1fr] gap-1.5">
                <input
                    type="number"
                    name="timeValue"
                    value={timeValue}
                    onChange={handleChange}
                    className="border border-[#ccc] text-sm p-0.5 text-gray-600 rounded-sm"
                />
                <select
                    name="timeUnit"
                    value={timeUnit}
                    onChange={handleChange}
                    className="border border-[#ccc] text-sm p-0.5 text-gray-600 rounded-sm"
                >
                    <option value="none"></option>
                    <option value="segundos">Segundos</option>
                    <option value="minutos">Minutos</option>
                    <option value="horas">Horas</option>
                </select>
                <AlertDialog>
                    <AlertDialogTrigger disabled={isButtonDisabled} className="p-0.5 border-0 bg-[#005596] rounded-sm  text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide">{buttonOperation}</AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-sm text-gray-600 font-semibold tracking-wide">¿Está seguro de realizar esta acción?</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-gray-600" >
                                Se cambiará el parámetro de <span className="text-red-700 font-bold">{typeOperation}</span> al valor de <span className="text-red-700 font-bold">{`${timeValue} ${timeUnit}`}</span>.
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
export default PlantDetailsPage;