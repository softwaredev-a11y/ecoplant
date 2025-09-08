import { useState, useEffect, useMemo, useRef } from 'react';
import HeaderPanel from './HeaderPanel';
import { useCommandExecution, usePlantDetailSocket } from '../../../hooks/usePlants';
import { processSocketMessage, getMvZeroText, formatTime } from '../../../utils/plantUtils';
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
        hasRunRef.current = false;
    }, [plant.id]);

    useEffect(() => {
        if (isLoadingStatus || !isConnected || !isOnline) return;

        if (hasRunRef.current) return;
        hasRunRef.current = true;

        const runCommands = async () => {
            const commands = ["QED06", "QED14", "QED34", "QXAGA03", "QXAGA00"];
            await executeMultipleCommands(plant.id, commands);
        };

        runCommands();
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
                break;
            case 'retrolavado':
                setRetrolavado(result.value);
                break;
            case 'enjuague':
                setEnjuague(result.value);
                break;
            case 'valorAlertaFlujo':
                setValorAlertaFlujo(result.value);
                break;
            case 'valorAlarmaInsuficiente':
                setValorAlarmaInsuficiente(result.value);
                break;
            default:
                break;
        }
    }, [lastEvent, mvZeroValue]);
    return (
        <div className="operations-container flex flex-col border border-[#ccc] mb-4 p-0 overflow-y-auto">
            <HeaderPanel title={"Párametros de operación"} />
            <div className="flex flex-col p-3.5 gap-6">
                <div className='border-b border-b-[#ccc]'>
                    <Operations typeOperation="Filtración" currentlyValue={isOnline ? filtrado === "" ? "Consultando." : filtrado : "No se puede mostrar esta información actualmente."} buttonOperation="Cambiar filtración" />
                    <Operations typeOperation="Retrolavado" currentlyValue={isOnline ? retrolavado === "" ? "Consultando." : retrolavado : "No se puede mostrar esta información actualmente."} buttonOperation="Cambiar retrolavado" />
                    <Operations typeOperation="Enjuague" currentlyValue={isOnline ? enjuague === "" ? "Consultando." : enjuague : "No se puede mostrar esta información actualmente."} buttonOperation="Cambiar enjuague" />
                </div>
                <div className='border-b border-b-[#ccc]'>
                    <Operations typeOperation="Alerta de flujo disminuyendo" currentlyValue={isOnline ? valorAlertaFlujo === "" ? "Consultando." : `${valorAlertaFlujo} gpm.` : "No se puede mostrar esta información actualmente."} buttonOperation="Cambiar umbral GPM" />
                    <Operations typeOperation="Alerta por flujo insuficiente" currentlyValue={isOnline ? valorAlarmaInsuficiente === "" ? "Consultando." : `${valorAlarmaInsuficiente} gpm.` : "No se puede mostrar esta información actualmente."} buttonOperation="Cambiar umbral GPM" />
                </div>

            </div>
        </div>
    );
}


function Operations({ typeOperation, currentlyValue, buttonOperation }) {
    const [isOpen, setIsOpen] = useState(false);
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
        <div className="flex flex-col gap-1 p-1 mb-1.5">
            <div className='div grid grid-cols-[130px_35px_1fr] gap-1.5 mb-0.5 items-center'>
                <span className="text-gray-600 font-semibold mr-1.5 break-words text-sm md:text-base lg:text-base">{typeOperation}: </ span>
                <span className=''></span>
                <div className='flex w-full justify-end'>
                    <span className={`font-semibold text-gray-600  text-sm md:text-base lg:text-base ${currentlyValue === "" ? "" : "p-0.5 bg-gray-200 rounded-sm"} text-center w-full  max-w-[300px]`}>{currentlyValue}</span>
                </div>
            </div>
            <div className="item-operation  grid grid-cols-[70px_95px_1fr] gap-1.5">
                <input
                    min={1}
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
                <div className='flex w-full justify-end'>
                    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                        <AlertDialogTrigger disabled={isButtonDisabled} className="p-0.5 border-0 bg-[#005596] rounded-sm  text-sm md:text-base lg:text-base cursor-pointer font-medium text-white hover:bg-[#0076D1] tracking-wide w-full max-w-[300px]">{buttonOperation}</AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-sm text-gray-600 font-semibold tracking-wide">¿Está seguro de realizar esta acción?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm text-gray-600" >
                                    Se cambiará el parámetro de <span className="text-red-700 font-bold">{typeOperation}</span> al valor de <span className="text-red-700 font-bold"> {isOpen ? formatTime(timeUnit, timeValue) : null}</span>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
                                <AlertDialogAction className="cursor-pointer bg-[#004275] hover:bg-[#0076D1]">Continuar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

            </div>
        </ div>
    )
}


export default OperationsPanel;