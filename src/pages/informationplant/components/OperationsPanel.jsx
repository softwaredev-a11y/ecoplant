import { useState, useEffect, useMemo, useRef } from 'react';
import HeaderPanel from './HeaderPanel';
import { useCommandExecution } from '../../../hooks/usePlants';
import { formatTime, getSetterMessage } from '../../../utils/plantUtils';
import { getEcoplantParams } from '../../../utils/syrus4Utils';
import { COMMANDS, OPERATION_CODES } from '../../../utils/constants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { useUsers } from "@/hooks/useUsers";
import { useOperationParameters } from '../../../hooks/useOperationParameters';

function OperationsPanel({ plant, isOnline, isLoadingStatus, isSyrus4, syrus4Data, isLoadingSyrus4 }) {
    const { parameters, commandStatus, mvZeroValue } = useOperationParameters(plant, isOnline, isLoadingStatus, isSyrus4);
    const dataSyrusFours = isLoadingSyrus4
        ? "Consultando"
        : syrus4Data?.params
            ? getEcoplantParams(syrus4Data.params, mvZeroValue)
            : "Problemas de comunicación. Intente más tarde";
    const getDisplayValue = (cmd, value, suffix = "") => {
        if (!isOnline) return "Información no disponible";
        if (commandStatus[cmd] === "loading") return "Consultando";
        if (commandStatus[cmd] === "error") return "Problemas de comunicación. Intente más tarde";
        return suffix ? `${value} ${suffix}` : value;
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
                        currentlyValue={isSyrus4 ? isLoadingSyrus4 ? "Consultando" : dataSyrusFours.filtracion : getDisplayValue(COMMANDS.FILTRATION, parameters.filtrado)}
                        buttonOperation="Cambiar filtración"
                        mvZeroValue={mvZeroValue}
                        plant={plant}
                    />
                    <Operations
                        isOnline={isOnline}
                        codeOperation={OPERATION_CODES.BACKWASH}
                        typeOperation="Retrolavado"
                        currentlyValue={isSyrus4 ? isLoadingSyrus4 ? "Consultando" : dataSyrusFours.retrolavado : getDisplayValue(COMMANDS.BACKWASH, parameters.retrolavado)}
                        buttonOperation="Cambiar retrolavado"
                        mvZeroValue={mvZeroValue}
                        plant={plant}
                    />
                    <Operations
                        isOnline={isOnline}
                        codeOperation={OPERATION_CODES.RINSE}
                        typeOperation="Enjuague"
                        currentlyValue={isSyrus4 ? isLoadingSyrus4 ? "Consultando" : dataSyrusFours.enjuague : getDisplayValue(COMMANDS.RINSE, parameters.enjuague)}
                        buttonOperation="Cambiar enjuague"
                        mvZeroValue={mvZeroValue}
                        plant={plant}
                    />
                </div>
                <div className="border-b border-b-[#ccc]">
                    <Operations
                        isOnline={isOnline}
                        codeOperation={OPERATION_CODES.FLOW_ALERT}
                        typeOperation="Alerta de flujo disminuyendo"
                        currentlyValue={isSyrus4 ? isLoadingSyrus4 ? "Consultando" : `${dataSyrusFours.alerta} gpm` : getDisplayValue(COMMANDS.FLOW_ALERT, parameters.valorAlertaFlujo, "gpm")}
                        buttonOperation="Cambiar umbral (gpm)"
                        mvZeroValue={mvZeroValue}
                        plant={plant}
                    />
                    <Operations
                        isOnline={isOnline}
                        codeOperation={OPERATION_CODES.INSUFFICIENT_FLOW_ALARM}
                        typeOperation="Alarmado por flujo insuficiente"
                        currentlyValue={isSyrus4 ? isLoadingSyrus4 ? "Consultando" : `${dataSyrusFours.alarma} gpm` : getDisplayValue(COMMANDS.INSUFFICIENT_FLOW_ALARM, parameters.valorAlarmaInsuficiente, "gpm")}
                        buttonOperation="Cambiar umbral (gpm)"
                        mvZeroValue={mvZeroValue}
                        plant={plant}
                    />
                </div>
            </div>
        </div>
    );
}

function Operations({ codeOperation, typeOperation, currentlyValue, buttonOperation, mvZeroValue, isOnline, plant }) {
    const [isOpen, setIsOpen] = useState(false);
    const [timeValue, setTimeValue] = useState("");
    const [timeUnit, setTimeUnit] = useState('none');

    const [isSending, setIsSending] = useState(false);
    const [commandFailed, setCommandFailed] = useState(false);
    const [countdown, setCountdown] = useState(15);
    const [displayValue, setDisplayValue] = useState(currentlyValue);
    const [isShowingServerError, setIsShowingServerError] = useState(false);
    const [outOfRangeError, setOutOfRangeError] = useState(false);

    const timeoutRef = useRef(null);
    const initialValueRef = useRef(null);
    const countdownIntervalRef = useRef(null);

    const isAlertOperation = codeOperation === OPERATION_CODES.INSUFFICIENT_FLOW_ALARM || codeOperation === OPERATION_CODES.FLOW_ALERT;
    const isButtonDisabled = !isOnline || commandFailed || isSending || !timeValue || (!isAlertOperation && timeUnit === 'none');
    const { executeMultipleCommands } = useCommandExecution();
    const { isSuperUser } = useUsers();


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

    const stopCountdown = () => {
        clearInterval(countdownIntervalRef.current);
    };

    const startCountdown = () => {
        stopCountdown();
        setCountdown(15);
        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
    };

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
        }
        //Añadir validación
    }, [currentlyValue, isSending]);

    useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current);
            stopCountdown();
        };
    }, []);

    const sendAndQuery = async (commandMessage, codeOperation) => {
        try {
            if (commandMessage != "") {
                console.log(`Se está enviando el siguiente comando: ${commandMessage}`);
                await executeMultipleCommands(plant.id, [commandMessage]);
            } else {
                console.error("No existe un mensaje, por lo que no se puede formatear.")
            }
        } catch (error) {
            console.error(`Ocurrió el siguiente error ${error} en la ejecución del comando ${codeOperation}`);
        }
    };

    const attemptToSend = (attemptsLeft, codeOp, commandMessage) => {
        if (attemptsLeft === 0) {
            setIsSending(false);
            setCommandFailed(true);
            stopCountdown();
            setTimeValue("");
            setTimeUnit("none");
            return;
        }

        startCountdown();
        sendAndQuery(commandMessage, codeOp);

        timeoutRef.current = setTimeout(() => {
            attemptToSend(attemptsLeft - 1, codeOp);
        }, 15000);
    };

    function handleClick(codeOperation) {
        setIsOpen(false);
        const commandMessage = getSetterMessage(codeOperation, timeValue, timeUnit, mvZeroValue);
        if (commandMessage === "") {
            setOutOfRangeError(true);
            setTimeout(() => {
                setOutOfRangeError(false);
                setTimeValue("");
                setTimeUnit("none");
            }, 10000);
            return;
        }

        setCommandFailed(false);
        initialValueRef.current = currentlyValue;
        setIsSending(true);
        attemptToSend(2, codeOperation, commandMessage);
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
                        {outOfRangeError
                            ? "Valor fuera de rango" : isSending
                                ? `Cargando nuevo valor (${countdown}s)`
                                : commandFailed
                                    ? "Problemas de comunicación. Intente más tarde"
                                    : displayValue}
                    </span>
                </div>
            </div>
            <>
                {isSuperUser && (
                    <div className={`item-operation  grid ${isAlertOperation ? "grid-cols-[165px_1fr]" : "grid-cols-[70px_95px_1fr]"}  ${isSuperUser ? "" : "hidden"} gap-1.5`}>
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
                                        <AlertDialogAction onClick={() => handleClick(codeOperation)} className="cursor-pointer bg-[#004275] hover:bg-[#0076D1]">Continuar</AlertDialogAction>
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