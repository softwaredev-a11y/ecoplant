import { useState, useMemo } from 'react';
import { formatTime, buildSetterCommand } from '@/utils/syrusUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useParameterUpdater } from '@/hooks/useParameterUpdates';
import { useUnifiedOperationParameters } from '@/hooks/useUnifiedOperationParameters';
import { buildSetterCommandSyrus4 } from '@/utils/syrus4Utils';
import { toast } from "sonner"
import { UI_MESSAGES, COMMAND_STATES, OPERATION_CODES, UNITS_MEASUREMENT } from "@/constants/constants";
import { useUsers } from "@/hooks/useUsers";
import HeaderPanel from './HeaderPanel';
import ScheduleSelector from "./ScheduleSelector";

/**
 * Componente que muestra la información de los parámetros de operación.
 * @param {object} props propiedades del componente
 * @param {object} props.plant - Planta seleccionada.
 * @param {boolean} props.isOnline - Valor que determina si la planta se encuentra en línea.
 * @param {boolean} props.isSyrus4 - Valor que determina si la planta es un dispositivo syrus 4.
 * @param {object} props.syrus4Data - Información de la planta en caso de que tenga un dispositivo Syrus 4.
 * @param {boolean} props.isLoadingSyrus4 - Valor que determina si se están cargando información de un dispositivo Syrus 4.  
 * @returns {JSX.Element} El componente de panel de operaciones.
 */
function OperationsPanel({ plant, isOnline, isLoadingStatus, isSyrus4, syrus4Data, isLoadingSyrus4 }) {
    //Hook personalizado que permite obtener la información unificada de dispositivos syrus 4 e inferiores.
    const { parameters, mvZeroValue, isManualChangeRef } = useUnifiedOperationParameters(plant, isOnline, isLoadingStatus, isSyrus4, syrus4Data, isLoadingSyrus4);
    //Función que obtiene el valor a mostrar.
    const getDisplayValue = (param) => {
        if (param.status === 'unavailable') return UI_MESSAGES.INFORMATION_NOT_AVAILABLE;
        if (param.status === COMMAND_STATES.LOADING) return UI_MESSAGES.CONSULTANDO;
        if (param.status === COMMAND_STATES.ERROR) return UI_MESSAGES.COMMUNICATION_PROBLEMS;
        return param.value;
    };

    // Props comunes para todos los componentes `Operations`, para evitar repetirlas en cada instancia.
    const commonProps = { isOnline, mvZeroValue, plant, isSyrus4, isManualChangeRef };

    // Se define una configuración de operaciones en un array.
    // Esto hace que el componente sea más declarativo y fácil de mantener.
    // Si se necesita añadir o quitar una operación, solo se modifica este array.
    const operationGroups = [
        [
            { codeOperation: OPERATION_CODES.FILTRATION, typeOperation: "Filtración", currentlyValue: getDisplayValue(parameters.filtracion), buttonOperation: "Cambiar filtración" },
            { codeOperation: OPERATION_CODES.INVW_TIME, typeOperation: "Retrolavado", currentlyValue: getDisplayValue(parameters.retrolavado), buttonOperation: "Cambiar retrolavado" },
            { codeOperation: OPERATION_CODES.RINSE, typeOperation: "Enjuague", currentlyValue: getDisplayValue(parameters.enjuague), buttonOperation: "Cambiar enjuague" },
        ],
        [
            { codeOperation: OPERATION_CODES.FLOW_ALERT, typeOperation: "Alerta de flujo disminuyendo", currentlyValue: getDisplayValue(parameters.valorAlertaFlujo), buttonOperation: "Cambiar umbral (gpm)" },
            { codeOperation: OPERATION_CODES.INSUFFICIENT_FLOW_ALARM, typeOperation: "Alarma por flujo insuficiente", currentlyValue: getDisplayValue(parameters.valorAlarmaInsuficiente), buttonOperation: "Cambiar umbral (gpm)" },
        ]
    ];

    return (
        <div className="operations-container flex flex-col border border-[#ccc] mb-4 p-0 overflow-y-auto">
            <HeaderPanel title={"Párametros de operación"} />
            <div className="flex flex-col p-1.5 gap-4">
                {/* Se itera sobre los grupos de operaciones para renderizarlos dinámicamente. */}
                {operationGroups.map((group, index) => (
                    <div key={index} className="border-b border-b-[#ccc]">
                        {group.map(op => (
                            <Operations key={op.codeOperation} {...commonProps} {...op} />
                        ))}
                    </div>
                ))}
                <div className="border-b border-b-[#ccc]">
                    <ScheduleSelector
                        isOnline={isOnline}
                        currentlyValue={getDisplayValue(parameters.horario)}
                        plant={plant}
                        isSyrus4={isSyrus4}
                        isManualChangeRef={isManualChangeRef}
                        typeOperation="Cambio de horario"
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * Componente que renderiza la información de un parametro de operación en particular.
 * @param {object} props Propiedades del componente.
 * @param {string} props.codeOperation - Código de la operación (filtrado, retrolavado... etc).
 * @param {string} props.typeOperation - Tipo de operación que va a ejecutar - Cambiar: filtración || retrolavado || enjuague || alerta gpm || alarma gpm
 * @param {string} props.currentyValue - Valor actual correspondiente a la operación. Filtrado, retrolavado y enjuague: Tiempo. Alertas y alarmas: gpm.
 * @param {string} props.buttonOperation - Texto que va a tener el botón de la operación.
 * @param {string} props.mvZeroValue - Texto que se obtiene de la descripción de la planta.
 * @param {boolean} props.isOnline - Valor que determina si la planta se encuentra en línea.
 * @param {boolean} props.isSyrus4 - Valor que determina si la planta tiene un dispositivo syrus 4.
 * @returns {JSX.Element} La fila correspondiente a la operación.
 */
function Operations({ codeOperation, typeOperation, currentlyValue, buttonOperation, mvZeroValue, isOnline, plant, isSyrus4, isManualChangeRef }) {
    const [isOpen, setIsOpen] = useState(false);
    const [timeValue, setTimeValue] = useState("");
    const [timeUnit, setTimeUnit] = useState('none');
    const { isSending, commandFailed, displayValue, executeUpdate } = useParameterUpdater(plant.id, currentlyValue, isSyrus4, isManualChangeRef, typeOperation);
    const isAlertOperation = codeOperation === OPERATION_CODES.INSUFFICIENT_FLOW_ALARM || codeOperation === OPERATION_CODES.FLOW_ALERT;
    const isButtonDisabled = !isOnline || commandFailed || isSending || !timeValue || (!isAlertOperation && timeUnit === 'none') || currentlyValue === UI_MESSAGES.COMMUNICATION_PROBLEMS;
    //Consume hook personalizado para determinar si es super usuario o no.
    const { isSuperUser } = useUsers();

    //Obtiene los valores que se introduzcan en el input.
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'timeValue') {
            if (value > 0 && value % 1 === 0) {
                setTimeValue(value);
            } else {
                setTimeValue("");
            }
        } else if (name === 'timeUnit') {
            setTimeUnit(value);
        }
    };

    /**
     * Maneja la lógica para el evento de click del botón de enviar de la alert.
     * @param {string | number} codeOperation Código que identifica la operación.
     * @param {boolean} isSyrus4 Determina si el dispositivo es un Syrus 4. 
     * @returns {void | null}
     */
    function handleClick() {
        setIsOpen(false);
        try {
            let commandMessage = isSyrus4 ? buildSetterCommandSyrus4(codeOperation, timeValue, timeUnit, mvZeroValue) : buildSetterCommand(codeOperation, timeValue, timeUnit, mvZeroValue);
            if (commandMessage === "") {
                toast.error("Error", {
                    description: `${UI_MESSAGES.VALUE_OUT_OF_RANGE}`,
                });
                setTimeValue("");
                setTimeUnit("none");
                return;
            }
            executeUpdate(commandMessage);

        } catch (error) {
            toast.error("Error", {
                description: `${UI_MESSAGES.OPERATION_NOT_POSIBLE}`,
            });
            console.log(`Ocurrió el siguiente error: ${error}`);
        }
    };
    //Formatea el nuevo valor, y lo muestra en pantalla.
    const formattedNewValue = useMemo(() => {
        if (!isOpen || !timeValue) return null;
        if (isAlertOperation) {
            return `${timeValue} ${UNITS_MEASUREMENT.GALLONS_PER_MINUTE}`;
        }
        if (timeUnit !== 'none') {
            return formatTime(timeUnit, timeValue);
        }
        return null;
    }, [isOpen, timeValue, timeUnit, isAlertOperation]);

    return (
        <div className={`flex flex-col gap-1 p-1 mb-1.5`}>
            <div className='div grid grid-cols-[130px_35px_1fr] gap-1.5 mb-0.5 items-center'>
                <span className="text-gray-600 font-semibold mr-1.5 break-words text-sm md:text-base lg:text-base">{typeOperation}: </ span>
                <span className=''></span>
                <div className='flex w-full justify-end'>
                    <span className={`font-semibold text-gray-600  text-sm md:text-base lg:text-base ${isSending || commandFailed || currentlyValue ? "p-0.5 bg-gray-200 rounded-sm" : ""}  w-full  max-w-[300px] break-words`}>
                        {displayValue}
                    </span>
                </div>
            </div>
            <>
                {isSuperUser && (
                    <div className={`item-operation  grid ${isAlertOperation ? "grid-cols-[165px_1fr]" : "grid-cols-[63px_102px_1fr]"}  ${isSuperUser ? "" : "hidden"} gap-1.5`}>
                        <input min="1" type="number" name="timeValue" value={timeValue} disabled={isSending} onChange={handleChange} className="border border-[#ccc] text-sm p-0.5 text-gray-600 rounded-sm" />
                        <select name="timeUnit" value={timeUnit} onChange={handleChange} disabled={isSending} className={`border border-[#ccc] text-sm p-0.5 text-gray-600 rounded-sm ${isAlertOperation ? "hidden" : "block"}`} >
                            <option value="none"></option>
                            <option value="segundos">Segundo(s)</option>
                            <option value="minutos">Minuto(s)</option>
                            <option value="horas">Hora(s)</option>
                        </select>
                        <div className='flex w-full justify-end'>
                            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                                <AlertDialogTrigger disabled={isButtonDisabled} className="p-0.5 border-0 bg-[#005596] rounded-sm  text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide w-full max-w-[300px] disabled:cursor-not-allowed">{isSending ? "Enviando..." : buttonOperation}</AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-sm text-gray-600 font-semibold tracking-wide">¿Está seguro de realizar esta acción?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-sm text-gray-600" >
                                            Se cambiará el parámetro de <span className="text-red-700 font-bold">{typeOperation}</span> al valor de <span className="text-red-700 font-bold">{formattedNewValue}</span>.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleClick} className="cursor-pointer bg-[#004275] hover:bg-[#0076D1]">Continuar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                )}
            </>
        </div>
    )
}

export default OperationsPanel;