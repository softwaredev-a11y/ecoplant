import { createContext, useEffect, useState } from "react";
import io from "socket.io-client";

/**
 * Contexto de React para el estado del socket de detalles de la planta.
 * Proporciona el último evento recibido y el estado de la conexión.
 * @type {React.Context<{lastEvent: object|null, isConnected: boolean}>}
 */
export const PlantDetailSocketContext = createContext();

/**
 * Componente proveedor que gestiona la conexión WebSocket para una planta específica.
 * Se conecta, autentica y escucha eventos en tiempo real si la planta está online.
 *
 * @param {object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes hijos que tendrán acceso al contexto.
 * @param {number|string|null} props.plantId - El ID de la planta a la que se debe conectar el socket.
 * @param {boolean} props.isOnline - Indica si la Ecoplanta está online.
 * @returns {JSX.Element}
 */
export const PlantDetailSocketProvider = ({ children, plantId, isOnline }) => {
    /** Almacena el último evento recibido del socket. */
    const [lastEvent, setLastEvent] = useState(null);
    /** Indica si el socket está actualmente conectado y autenticado. */
    const [isConnected, setIsConnected] = useState(false);

    /**
     * Efecto que maneja el ciclo de vida de la conexión del socket.
     * Se conecta cuando `plantId` y `isOnline` son verdaderos, y se desconecta
     * cuando el componente se desmonta o las dependencias cambian.
     */
    useEffect(() => {
        let socket;

        // Solo intenta conectar si tenemos un ID de planta y está online.
        if (plantId && isOnline) {
            // Inicializa la conexión del socket, forzando el transporte de websocket.
            socket = io("https://aws-live-1.pegasusgateway.com/socket", {
                transports: ["websocket"],
            });

            // Credenciales para la autenticación en el socket.
            const credentials = {
                pegasus: "https://rastreo.totaltracking.co",
                auth: sessionStorage.getItem("token"),
            };

            // Evento: Conexión exitosa.
            socket.on("connect", () => {
                if (!isOnline) return; // Doble chequeo por si el estado cambió durante la conexión.
                setIsConnected(true);
                // Intenta autenticar el socket.
                socket.emit("authenticate", credentials);
            });

            // Evento: Autenticación exitosa.
            socket.on("_authenticated", () => {
                console.log("Autenticado en socket");
                // Se suscribe a los eventos de la Ecoplanta seleccionada.
                socket.emit("listen", {
                    namespace: "vehicle-events",
                    objects: plantId,
                    compact: true,
                });
            });

            // Evento: Recepción de nuevos eventos de la planta.
            socket.on("events", (envelope) => {
                setLastEvent(envelope);
            });

            // Evento: Desconexión del socket.
            socket.on("disconnect", () => {
                setIsConnected(false);
                console.warn("Socket desconectado");
            });

            // Evento: Error durante el intento de conexión.
            socket.on("connect_error", (err) => {
                console.error("Error de conexión:", err.message);
            });

            // Evento: Error de autenticación devuelto por el servidor de sockets.
            socket.on("_error", (message) => {
                console.error("Error de autenticación:", message);
            });
        } else {
            console.log("Dispositivo offline, no conectar socket");
        }

        // Función de limpieza: se ejecuta cuando el componente se desmonta o las dependencias cambian.
        return () => {
            if (socket) {
                // Elimina todos los listeners para evitar fugas de memoria.
                socket.removeAllListeners();
                // Si el socket está conectado o conectándose, lo desconecta.
                if (socket.connected || socket.connecting) {
                    console.log("Cerrando socket...");
                    socket.disconnect();
                } else {
                    console.log("Socket nunca terminó de conectar, no hay nada que cerrar");
                }
            }
            // Resetea el estado de conexión.
            setIsConnected(false);
        };
    }, [plantId, isOnline]);

    // Proporciona el último evento y el estado de la conexión a los componentes hijos.
    return (
        <PlantDetailSocketContext.Provider value={{ lastEvent, isConnected }}>
            {children}
        </PlantDetailSocketContext.Provider>
    );
};