import { useState, useEffect, useRef, useCallback } from "react";
import { useCommandExecution } from "./usePlants";
import { UI_MESSAGES } from "@/constants/constants";
import { useUsers } from "../hooks/useUsers"
import { sendLogToCliq } from "../services/cliq.service"

/**
 * Hook personalizado para gestionar el envío de comandos para el cambio de parámetros de 
 * operación de la Ecoplanta (filtración, retrolavado, enjuague, alerta, alarma y horarios de operación).
 * @param {number} plantId ID de la planta seleccionada 
 * @param {number || string} currentlyValue  Valor actual del parámetro de operación
 * @param {boolean} isSyrus4 Valor que demuestra si es un dispositivo syrus 4.
 * @returns {isSending: boolean, commandFailed: boolean, 
 * displayValue: string, executeUpdate: (commandMessage: string) => void}
 */
export function useParameterUpdater(plantId, currentlyValue, isSyrus4, isManualChangeRef, typeOperation) {
    //Llama al hook que permite realizar el envio de múltiplés comandos.
    const { executeMultipleCommands } = useCommandExecution();

    const [isSending, setIsSending] = useState(false);
    const [commandFailed, setCommandFailed] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const [displayValue, setDisplayValue] = useState(currentlyValue);
    const [isShowingServerError, setIsShowingServerError] = useState(false);

    const timeoutRef = useRef(null);
    const initialValueRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const { user } = useUsers();

    //Detiene la cuenta regresiva cuando existe una respuesta al comando ejecutado.
    const stopCountdown = () => {
        clearInterval(countdownIntervalRef.current);
    };

    //Inicia una cuenta regresiva después de que se ejecuta un comando.
    //La cuenta es de 30 segundos.
    const startCountdown = () => {
        stopCountdown();
        setCountdown(30);
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
        else if (displayValue !== initialValueRef.current && displayValue !== UI_MESSAGES.CONSULTANDO) {
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
        const commandsToSend = Array.isArray(commandMessage) ? commandMessage : [commandMessage];
        try {
            if (commandsToSend.length > 0) {
                await executeMultipleCommands(plantId, commandsToSend, isSyrus4);
                await sendLogToCliq(`El usuario ${user.email} realizó el cambio de ${typeOperation} a la Ecoplanta con ID: ${plantId}.\nLa aplicación envió el siguiente comando: ${commandMessage}`)
            } else {
                await sendLogToCliq(`Ocurrió un error cuando el usuario ${user.email} intentó realizar el envío de comando pero la app no generó el mensaje.`)
            }
        } catch (error) {
            await sendLogToCliq(`Ocurrió un error cuando el usuario ${user.email} envió un comando a la Ecoplanta con ID:${plantId}.\nDetalle: ${error?.message}`)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plantId, isSyrus4, executeMultipleCommands]);

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
        }, 30000);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sendCommand]);

    const executeUpdate = useCallback((commandMessage) => {
        if (!commandMessage) return;
        if (isManualChangeRef) {
            isManualChangeRef.current = true;
        }
        setCommandFailed(false);
        initialValueRef.current = currentlyValue;
        setIsSending(true);
        attemptToSend(2, commandMessage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentlyValue, attemptToSend]);

    const display = isSending ? `Cargando nuevo valor (${countdown}s)` : (commandFailed ? UI_MESSAGES.COMMUNICATION_PROBLEMS : displayValue);

    return { isSending, commandFailed, displayValue: display, executeUpdate };
}