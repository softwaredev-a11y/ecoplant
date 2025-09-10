import { useState, useEffect, useMemo, useRef } from 'react';
import HeaderPanel from './HeaderPanel';
import { useCommandExecution, usePlantDetailSocket } from '../../../hooks/usePlants';
import { processSocketMessage, getMvZeroText, formatTime, getSetterMessage } from '../../../utils/plantUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';

function OperationsPanel({ plant, isOnline, isLoadingStatus }) {
    const { executeMultipleCommands } = useCommandExecution();
    const { lastEvent, isConnected } = usePlantDetailSocket();

    const [filtrado, setFiltrado] = useState("");
    const [retrolavado, setRetrolavado] = useState("");
    const [enjuague, setEnjuague] = useState("");
    const [valorAlarmaInsuficiente, setValorAlarmaInsuficiente] = useState("");
    const [valorAlertaFlujo, setValorAlertaFlujo] = useState("");

    const mvZeroValue = useMemo(() => {
        if (plant?.info?.description) {
            return getMvZeroText(plant.info.description);
        }
        return null;
    }, [plant?.info?.description]);

    const hasRunRef = useRef(false);

    useEffect(() => {
        if (isLoadingStatus || !isConnected || !isOnline) {

            hasRunRef.current = false;
            return;
        }
        if (hasRunRef.current) return;
        hasRunRef.current = true;
        const commands = ["QED06", "QED14", "QED34", "QXAGA03", "QXAGA00"];
        executeMultipleCommands(plant.id, commands);
    }, [isLoadingStatus, isConnected, isOnline, plant.id, executeMultipleCommands]);


    useEffect(() => {
        const message = lastEvent?.payload?.event?.message;
        if (!message) {
            return;
        }
        const result = processSocketMessage(message, mvZeroValue);
        if (!result) {
            return;
        }

        switch (result.key) {
            case 'filtrado':
                setFiltrado(result.value);
                sessionStorage.setItem('filtrado', message);
                break;
            case 'retrolavado':
                setRetrolavado(result.value);
                sessionStorage.setItem('retrolavado', message);
                break;
            case 'enjuague':
                setEnjuague(result.value);
                sessionStorage.setItem('enjuague', message);
                break;
            case 'valorAlertaFlujo':
                setValorAlertaFlujo(result.value);
                sessionStorage.setItem('alertaflujo', message);
                break;
            case 'valorAlarmaInsuficiente':
                setValorAlarmaInsuficiente(result.value);
                sessionStorage.setItem('alarmainsuficiente', message);
                break;
            default:
                break;
        }
    }, [lastEvent, mvZeroValue]);
    return (
        <div className="operations-container flex flex-col border border-[#ccc] mb-4 p-0 overflow-y-auto">
            <HeaderPanel title={"Párametros de operación"} />
            <div className="flex flex-col p-1.5 gap-4">
                <div className='border-b border-b-[#ccc]'>
                    <Operations codeOperation="65" typeOperation="Filtración" currentlyValue={isOnline ? filtrado === "" ? "Consultando" : filtrado : "Información no disponible"} buttonOperation="Cambiar filtración" mvZeroValue={mvZeroValue} />
                    <Operations codeOperation="32" typeOperation="Retrolavado" currentlyValue={isOnline ? retrolavado === "" ? "Consultando" : retrolavado : "Información no disponible"} buttonOperation="Cambiar retrolavado" mvZeroValue={mvZeroValue} />
                    <Operations codeOperation="12" typeOperation="Enjuague" currentlyValue={isOnline ? enjuague === "" ? "Consultando" : enjuague : "Información no disponible"} buttonOperation="Cambiar enjuague" mvZeroValue={mvZeroValue} />
                </div>
                <div className='border-b border-b-[#ccc]'>
                    <Operations codeOperation="03" typeOperation="Alerta de flujo disminuyendo" currentlyValue={isOnline ? valorAlertaFlujo === "" ? "Consultando" : `${valorAlertaFlujo} gpm` : "Información no disponible"} buttonOperation="Cambiar umbral (gpm)" mvZeroValue={mvZeroValue} />
                    <Operations codeOperation="00" typeOperation="Alerta por flujo insuficiente" currentlyValue={isOnline ? valorAlarmaInsuficiente === "" ? "Consultando" : `${valorAlarmaInsuficiente} gpm` : "Información no disponible"} buttonOperation="Cambiar umbral (gpm)" mvZeroValue={mvZeroValue} />
                </div>

            </div>
        </div>
    );
}


function Operations({ codeOperation, typeOperation, currentlyValue, buttonOperation, mvZeroValue }) {
    const [isOpen, setIsOpen] = useState(false);
    const [timeValue, setTimeValue] = useState("");
    const [timeUnit, setTimeUnit] = useState('none');
    const [value, setValue] = useState(currentlyValue);
    const [attempts, setAttempts] = useState(2);

    const isAlertOperation = codeOperation === "00" || codeOperation === "03";
    const isButtonDisabled = !timeValue || (!isAlertOperation && timeUnit === 'none');

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

    function handleClick(codeOperation) {
        const message = getSetterMessage(codeOperation, isAlertOperation, timeValue, timeUnit, mvZeroValue);
        console.log(message);
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
        <div className="flex flex-col gap-1 p-1 mb-1.5">
            <div className='div grid grid-cols-[130px_35px_1fr] gap-1.5 mb-0.5 items-center'>
                <span className="text-gray-600 font-semibold mr-1.5 break-words text-sm md:text-base lg:text-base">{typeOperation}: </ span>
                <span className=''></span>
                <div className='flex w-full justify-end'>
                    <span className={`font-semibold text-gray-600  text-sm md:text-base lg:text-base ${currentlyValue === "" ? "" : "p-0.5 bg-gray-200 rounded-sm"}  w-full  max-w-[300px]`}>{currentlyValue}</span>
                </div>
            </div>
            <div className={`item-operation  grid ${isAlertOperation ? "grid-cols-[165px_1fr]" : "grid-cols-[70px_95px_1fr]"} gap-1.5`}>
                <input
                    min="1"
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
                    className={`border border-[#ccc] text-sm p-0.5 text-gray-600 rounded-sm ${isAlertOperation ? "hidden" : "block"}`}
                >
                    <option value="none"></option>
                    <option value="segundos">Segundos</option>
                    <option value="minutos">Minutos</option>
                    <option value="horas">Horas</option>
                </select>
                <div className='flex w-full justify-end'>
                    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                        <AlertDialogTrigger disabled={isButtonDisabled} className="p-0.5 border-0 bg-[#005596] rounded-sm  text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide w-full max-w-[300px">{buttonOperation}</AlertDialogTrigger>
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
        </ div>
    )
}


export default OperationsPanel;