import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Clock } from 'lucide-react';
import { buildSetOperationHoursCommand, buildSetOperationHoursCommandSyrus4 } from "@/utils/operationHoursUtils";
import { useSchedulePicker } from "@/hooks/useSchedulePicker";
import { ERROR_MESSAGES } from "@/utils/constants";
import { useParameterUpdater } from '@/hooks/useParameterUpdates';
import { useUsers } from "@/hooks/useUsers";
import { COMMAND_STATES } from "@/utils/constants";

/**
 * Componente que le permite seleccionar al usuario horarios de operación de las Ecoplantas.
 * @param {object} props Objeto con las propiedades 
 * @param {Boolean} props.isOnline Valor que determina si la planta está con conexión
 * @param {object} props.plant Objeto con la información de la Ecoplanta seleccionada.
 * @param {String} props.currentlyValue Valor del horario actual o con respuesta procesada del mensaje del socket. (00:00 am/pm a 00:00 am/pm)
 * @param {Boolean} props.isManualChangeRef Valor que determina si se está realizando un cambio en parámetros de operación.
 * @returns {JSX.Element} Componente que le permite al usuario escoger horarios de operación en el calendario.
 */
export default function SchedulePicker({ isOnline, plant, currentlyValue, isSyrus4, isManualChangeRef }) {

    const [isOpen, setIsOpen] = useState(false);
    const { rangeStart, rangeEnd, selectedHours, scheduleDescription, handleHourClick, revertToInitialState, selectAll, selectWorkingHours,
        selectNonWorkingHours, hours, startHour, endHour } = useSchedulePicker(currentlyValue);
    const { isSending, commandFailed, displayValue, executeUpdate } = useParameterUpdater(plant.id, currentlyValue, isSyrus4);
    const isButtonDisabled = !isOnline || currentlyValue === ERROR_MESSAGES.COMMUNICATION_PROBLEMS || selectedHours.length <= 1 && (rangeStart == null || rangeEnd == null) || isSending || commandFailed;
    const { isSuperUser } = useUsers();

    function handleClick() {
        setIsOpen(false);
        try {
            let commands = isSyrus4 ? [buildSetOperationHoursCommandSyrus4(rangeStart, rangeEnd)] : buildSetOperationHoursCommand(rangeStart, rangeEnd);
            if (!commands || commands.length === 0 || commands.includes("")) {
                console.log("No fue posible enviar el comando. Intente nuevamente.")
                return;
            }
            if (isManualChangeRef) {
                isManualChangeRef.current = true;
            }
            executeUpdate(commands);
        } catch (error) {
            console.log(`Ocurrió el siguiente error: ${error}`);
        }
    };
    return (
        <div className="flex flex-col gap-1 p-1 mb-1.5">
            <div className='div grid grid-cols-[130px_35px_1fr] gap-1.5 mb-0.5 items-center'>
                <span className="text-gray-600 font-semibold mr-1.5 break-words text-sm md:text-base lg:text-base">Horario de operación:</ span>
                <span className=''></span>
                <div className='flex w-full justify-end'>
                    <span className={` font-semibold text-gray-600  text-sm md:text-base lg:text-base p-0.5 bg-gray-200 rounded-sm   w-full  max-w-[300px] break-words`}>
                        {displayValue} <span className='text-xs text-gray-600 font-normal'>{currentlyValue === ERROR_MESSAGES.INFORMATION_NOT_AVAILABLE || currentlyValue === COMMAND_STATES.CONSULTANDO || currentlyValue === ERROR_MESSAGES.COMMUNICATION_PROBLEMS ? "" : "(GMT-5)"}</span>
                    </span>
                </div>

                <Accordion type="single" collapsible className={"col-span-3"}>
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="flex justify-center text-gray-600 font-semibold mr-1.5 break-words text-sm text-center">Establecer nuevo horario</AccordionTrigger>
                        <AccordionContent>
                            <div className="flex justify-between">
                                <Clock color="#718096" />
                                <button onClick={selectAll} className="text-[#005596] font-semibold mr-1.5 break-words text-sm cursor-pointer">24 horas</button>
                                <button onClick={selectWorkingHours} className="text-[#005596] font-semibold mr-1.5 break-words text-sm cursor-pointer">Horas laborales</button>
                                <button onClick={selectNonWorkingHours} className="text-[#005596] font-semibold mr-1.5 break-words text-sm cursor-pointer">Horas no laborales</button>
                            </div>
                            <div className="grid grid-cols-8 gap-1 mb-4">
                                {hours.map((hour) => (
                                    <button key={hour} onClick={() => handleHourClick(hour)}
                                        className={`py-1 text-sm cursor-pointer ${hour === startHour || hour === endHour
                                            ? "bg-gray-400 text-gray-600 font-semibold"
                                            : selectedHours.includes(hour)
                                                ? "bg-gray-300 text-gray-600 font-semibold"
                                                : "bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {hour}
                                    </button>
                                ))}
                            </div>
                            {isSuperUser && (
                                <div className="flex justify-between">
                                    <button onClick={revertToInitialState} className="px-0.5 py-0.5 text-red-600 font-medium text-sm rounded  cursor-pointer">
                                        Cancelar
                                    </button>
                                    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                                        <AlertDialogTrigger disabled={isButtonDisabled} className="px-0.5 py-0.5  text-sm rounded font-semibold text-[#005596] cursor-pointer disabled:cursor-not-allowed">
                                            Cambiar horario de operación
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-sm text-gray-600 font-semibold tracking-wide">¿Está seguro de realizar esta acción?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-sm text-gray-600" >
                                                    Se cambiará el <span className="text-red-700 font-bold">horario de operación</span> a: <span className="text-red-700 font-bold">{scheduleDescription}</span>.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleClick} className="cursor-pointer bg-[#004275] hover:bg-[#0076D1]">Continuar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

            </div>
        </div>
    );
}