import { useState, useEffect, useMemo, useRef } from 'react';
import HeaderPanel from './HeaderPanel';
import { useCommandExecution } from '@/hooks/usePlants';
import { formatTime, buildSetterCommand } from '@/utils/syrusUtils';
import { OPERATION_CODES } from '@/utils/constants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUsers } from "@/hooks/useUsers";
import { useUnifiedOperationParameters } from '@/hooks/useUnifiedOperationParameters';
import { buildSetterCommandSyrus4 } from '@/utils/syrus4Utils';
import { toast } from 'react-toastify';
import { ERROR_MESSAGES } from "@/utils/constants";

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
    const { parameters, mvZeroValue } = useUnifiedOperationParameters(plant, isOnline, isLoadingStatus, isSyrus4, syrus4Data, isLoadingSyrus4);
    //Función que obtiene el valor a mostrar.
    const getDisplayValue = (param) => {
        if (param.status === 'unavailable') return ERROR_MESSAGES.INFORMATION_NOT_AVAILABLE;
        if (param.status === 'loading') return "Consultando";
        if (param.status === 'error') return ERROR_MESSAGES.COMMUNICATION_PROBLEMS;
        return param.value;
    };

    return (
        <div className="operations-container flex flex-col border border-[#ccc] mb-4 p-0 overflow-y-auto">
            <HeaderPanel title={"Párametros de operación"} />
            <div className="flex flex-col p-1.5 gap-4">
                <div className="border-b border-b-[#ccc]">
                    <Operations
                        isOnline={isOnline}
                        codeOperation={OPERATION_CODES.FILTRATION}
                        typeOperation="Filtración"
                        currentlyValue={getDisplayValue(parameters.filtracion)}
                        buttonOperation="Cambiar filtración"
                        mvZeroValue={mvZeroValue}
                        plant={plant}
                        isSyrus4={isSyrus4}
                    />
                    <Operations
                        isOnline={isOnline}
                        codeOperation={OPERATION_CODES.INVW_TIME}
                        typeOperation="Retrolavado"
                        currentlyValue={getDisplayValue(parameters.retrolavado)}
                        buttonOperation="Cambiar retrolavado"
                        mvZeroValue={mvZeroValue}
                        plant={plant}
                        isSyrus4={isSyrus4}
                    />
                    <Operations
                        isOnline={isOnline}
                        codeOperation={OPERATION_CODES.RINSE}
                        typeOperation="Enjuague"
                        currentlyValue={getDisplayValue(parameters.enjuague)}
                        buttonOperation="Cambiar enjuague"
                        mvZeroValue={mvZeroValue}
                        plant={plant}
                        isSyrus4={isSyrus4}
                    />
                </div>
                <div className="border-b border-b-[#ccc]">
                    <Operations
                        isOnline={isOnline}
                        codeOperation={OPERATION_CODES.FLOW_ALERT}
                        typeOperation="Alerta de flujo disminuyendo"
                        currentlyValue={getDisplayValue(parameters.valorAlertaFlujo)}
                        buttonOperation="Cambiar umbral (gpm)"
                        mvZeroValue={mvZeroValue}
                        plant={plant}
                        isSyrus4={isSyrus4}
                    />
                    <Operations
                        isOnline={isOnline}
                        codeOperation={OPERATION_CODES.INSUFFICIENT_FLOW_ALARM}
                        typeOperation="Alarma por flujo insuficiente"
                        currentlyValue={getDisplayValue(parameters.valorAlarmaInsuficiente)}
                        buttonOperation="Cambiar umbral (gpm)"
                        mvZeroValue={mvZeroValue}
                        plant={plant}
                        isSyrus4={isSyrus4}
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
function Operations({ codeOperation, typeOperation, currentlyValue, buttonOperation, mvZeroValue, isOnline, plant, isSyrus4 }) {
    const [isOpen, setIsOpen] = useState(false);
    const [timeValue, setTimeValue] = useState("");
    const [timeUnit, setTimeUnit] = useState('none');

    const [isSending, setIsSending] = useState(false);
    const [commandFailed, setCommandFailed] = useState(false);
    const [countdown, setCountdown] = useState(15);
    const [displayValue, setDisplayValue] = useState(currentlyValue);
    const [isShowingServerError, setIsShowingServerError] = useState(false);

    const timeoutRef = useRef(null);
    const initialValueRef = useRef(null);
    const countdownIntervalRef = useRef(null);

    const isAlertOperation = codeOperation === OPERATION_CODES.INSUFFICIENT_FLOW_ALARM || codeOperation === OPERATION_CODES.FLOW_ALERT;
    const isButtonDisabled = !isOnline || commandFailed || isSending || !timeValue || (!isAlertOperation && timeUnit === 'none') || currentlyValue === ERROR_MESSAGES.COMMUNICATION_PROBLEMS;
    const { executeMultipleCommands } = useCommandExecution();
    const notify = () => toast.error("Error: Valor fuera de rango", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
    });

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
    //Detiene la cuenta regresiva cuando existe una respuesta al comando ejecutado.
    const stopCountdown = () => {
        clearInterval(countdownIntervalRef.current);
    };
    //Inicia una cuenta regresiva después de que se ejecuta un comando.
    //La cuenta es de 15 segundos.
    const startCountdown = () => {
        stopCountdown();
        setCountdown(15);
        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
    };
    //Si no se está mostrando un mensaje de error del servidor, entonces,
    //muestra el mensaje nuevo.
    useEffect(() => {
        if (!isShowingServerError) {
            setDisplayValue(currentlyValue);
        }
    }, [currentlyValue, isShowingServerError]);

    useEffect(() => {
        if (!isSending) return;
        const isErrorValue = currentlyValue.includes("inválido");
        // Caso 1: El servidor respondió con un mensaje de error conocido
        if (isErrorValue) {
            clearTimeout(timeoutRef.current);
            stopCountdown();
            setIsSending(false);
            setIsShowingServerError(true);
            setDisplayValue(currentlyValue);
            setCommandFailed(false);

            const errorTimer = setTimeout(() => {
                setDisplayValue(initialValueRef.current);
                setIsShowingServerError(false);
            }, 5000);

            setTimeValue("");
            setTimeUnit("none");

            return () => clearTimeout(errorTimer);
        }
        // Caso 2: El servidor respondió con un nuevo valor exitoso
        else if (currentlyValue !== initialValueRef.current && !currentlyValue.includes("Consultando")) {
            clearTimeout(timeoutRef.current);
            stopCountdown();
            setIsSending(false);
            setCommandFailed(false);
            setTimeValue("");
            setTimeUnit("none");
        }
    }, [currentlyValue, isSending]);

    useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current);
            stopCountdown();
        };
    }, []);

    /**
     * Envia los comandos para modificar parámetros de operación
     * @param {string} commandMessage Comando que se envía para modificar el valor del parámetro de operación.
     * @param {string | number} codeOperation Código que identifica la operación.
     * @param {boolean} isSyrus4 Determina si el dispositivo es Syrus 4.
     */
    const sendAndQuery = async (commandMessage, codeOperation, isSyrus4) => {
        try {
            if (commandMessage != "") {
                console.log("Se está enviando el siguiente comando: ", commandMessage)
                await executeMultipleCommands(plant.id, [commandMessage], isSyrus4);
            } else {
                console.error("No existe un mensaje, por lo que no se puede formatear.")
            }
        } catch (error) {
            console.error(`Ocurrió el siguiente error ${error} en la ejecución del comando ${codeOperation}`);
        }
    };

    /**
     * Maneja la lógica para el reintento en envío de comandos.
     * @param {number} attemptsLeft Intentos restantes para enviar el comando
     * @param {string | number} codeOp Código que identifica la operación.
     * @param {string} commandMessage Comando que se envía para realizar el cambio en el párametro de operación.
     * @param {boolean} isSyrus4 Determina si el dispositivo es Syrus 4.
     * @returns {void | null}
     */
    const attemptToSend = (attemptsLeft, codeOp, commandMessage, isSyrus4) => {
        if (attemptsLeft === 0) {
            setIsSending(false);
            setCommandFailed(true);
            stopCountdown();
            setTimeValue("");
            setTimeUnit("none");
            return;
        }

        startCountdown();
        sendAndQuery(commandMessage, codeOp, isSyrus4);

        timeoutRef.current = setTimeout(() => {
            attemptToSend(attemptsLeft - 1, codeOp, commandMessage, isSyrus4);
        }, 15000);
    };

    /**
     * Maneja la lógica para el evento de click del botón de enviar de la alert.
     * @param {string | number} codeOperation Código que identifica la operación.
     * @param {boolean} isSyrus4 Determina si el dispositivo es un Syrus 4. 
     * @returns {void | null}
     */
    function handleClick(codeOperation, isSyrus4) {
        setIsOpen(false);
        let commandMessage = isSyrus4 ? buildSetterCommandSyrus4(codeOperation, timeValue, timeUnit, mvZeroValue) : buildSetterCommand(codeOperation, timeValue, timeUnit, mvZeroValue);
        if (commandMessage === "") {
            notify();
            setTimeValue("");
            setTimeUnit("none");
            return;
        }
        setCommandFailed(false);
        initialValueRef.current = currentlyValue;
        setIsSending(true);
        attemptToSend(2, codeOperation, commandMessage, isSyrus4);
    };

    const formattedNewValue = useMemo(() => {
        if (!isOpen || !timeValue) return null;
        if (isAlertOperation) {
            return `${timeValue} gpm`;
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
                    <span className={`font-semibold text-gray-600  text-sm md:text-base lg:text-base ${isSending || commandFailed || displayValue ? "p-0.5 bg-gray-200 rounded-sm" : ""}  w-full  max-w-[300px] break-words`}>
                        {isSending
                            ? `Cargando nuevo valor (${countdown}s)`
                            : commandFailed
                                ? ERROR_MESSAGES.COMMUNICATION_PROBLEMS
                                : displayValue}
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
                                        <AlertDialogAction onClick={() => handleClick(codeOperation, isSyrus4)} className="cursor-pointer bg-[#004275] hover:bg-[#0076D1]">Continuar</AlertDialogAction>
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