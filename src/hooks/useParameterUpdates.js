import { useState, useEffect, useRef, useCallback } from "react";
import { useCommandExecution } from "./usePlants";
import { ERROR_MESSAGES } from "@/utils/constants";

/**
 * Hook personalizado para gestionar el envío de comandos para el cambio de parámetros de 
 * operación de la Ecoplanta (filtración, retrolavado, enjuague, alerta, alarma y horarios de operación).
 * @param {number} plantId ID de la planta seleccionada 
 * @param {number || string} currentlyValue  Valor actual del parámetro de operación
 * @param {boolean} isSyrus4 Valor que demuestra si es un dispositivo syrus 4.
 * @returns {isSending: boolean, commandFailed: boolean, 
 * displayValue: string, executeUpdate: (commandMessage: string) => void}
 */
export function useParameterUpdater(plantId, currentlyValue, isSyrus4) {
    //Llama al hook que permite realizar el envio de múltiplés comandos.
    const { executeMultipleCommands } = useCommandExecution();

    const [isSending, setIsSending] = useState(false);
    const [commandFailed, setCommandFailed] = useState(false);
    const [countdown, setCountdown] = useState(15);
    const [displayValue, setDisplayValue] = useState(currentlyValue);
    const [isShowingServerError, setIsShowingServerError] = useState(false);

    const timeoutRef = useRef(null);
    const initialValueRef = useRef(null);
    const countdownIntervalRef = useRef(null);

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
        const isErrorValue = displayValue.includes("inválido");
        // Caso 1: El servidor respondió con un mensaje de error conocido
        if (isErrorValue) {
            clearTimeout(timeoutRef.current);
            stopCountdown();
            setIsSending(false);
            setIsShowingServerError(true);
            setCommandFailed(false);

            const errorTimer = setTimeout(() => {
                setDisplayValue(initialValueRef.current);
                setIsShowingServerError(false);
            }, 5000);

            return () => clearTimeout(errorTimer);
        }
        // Caso 2: El servidor respondió con un nuevo valor exitoso
        else if (displayValue !== initialValueRef.current && displayValue !== "Consultando") {
            clearTimeout(timeoutRef.current);
            stopCountdown();
            setIsSending(false);
            setCommandFailed(false);
        }
    }, [displayValue, isSending]);

    useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current);
            stopCountdown();
        };
    }, []);

    //Envía el comando a la planta seleccionada.
    const sendCommand = useCallback(async (commandMessage) => {
        try {
            if (commandMessage) {
                await executeMultipleCommands(plantId, [commandMessage], isSyrus4);
            } else {
                console.error("No existe un mensaje, por lo que no se puede formatear.");
            }
        } catch (error) {
            console.error(`Ocurrió un error en la ejecución del comando: ${error}`);
        }
    }, [plantId, executeMultipleCommands]);

    //Maneja la lógica para calcular los reintentos.
    const attemptToSend = useCallback((attemptsLeft, commandMessage) => {
        if (attemptsLeft === 0) {
            setIsSending(false);
            setCommandFailed(true);
            stopCountdown();
            return;
        }

        startCountdown();
        sendCommand(commandMessage);

        timeoutRef.current = setTimeout(() => {
            attemptToSend(attemptsLeft - 1, commandMessage);
        }, 15000);
    }, [sendCommand]);

    const executeUpdate = useCallback((commandMessage) => {
        if (!commandMessage) return;

        setCommandFailed(false);
        initialValueRef.current = currentlyValue;
        setIsSending(true);
        attemptToSend(2, commandMessage);
    }, [currentlyValue, attemptToSend]);

    const display = isSending ? `Cargando nuevo valor (${countdown}s)` : (commandFailed ? ERROR_MESSAGES.COMMUNICATION_PROBLEMS : displayValue);

    return { isSending, commandFailed, displayValue: display, executeUpdate };
}