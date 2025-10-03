import { createContext, useEffect, useState, useRef } from "react";
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
    const [lastEvent, setLastEvent] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const socketRef = useRef(null);
    const lastPlantIdRef = useRef(null);

    /**
     * Efecto para manejar la conexión y desconexión global del socket.
     * Se ejecuta solo una vez, al montar el componente.
     */
    useEffect(() => {
        // Inicializa la conexión del socket, forzando el transporte de websocket.
        const socket = io("https://aws-live-1.pegasusgateway.com/socket", {
            transports: ["websocket"],
        });
        socketRef.current = socket;

        const credentials = {
            pegasus: "https://rastreo.totaltracking.co",
            auth: sessionStorage.getItem("token"),
        };

        socket.on("connect", () => {
            setIsConnected(true);
            socket.emit("authenticate", credentials);
        });

        socket.on("_authenticated", () => {
            setIsAuthenticated(true);
        });

        socket.on("events", (envelope) => {
            setLastEvent(envelope);
        });

        socket.on("disconnect", (reason) => {
            setIsConnected(false);
            console.warn(`Evento: 'disconnect'. Razón: ${reason}`);
        });

        socket.on("connect_error", (err) => {
            console.error(` Evento: 'connect_error'. Mensaje: ${err.message}`);
            setIsConnected(false);
        });

        socket.on("_error", (message) => {
            console.error(`Evento: '_error'. Mensaje: ${message}`);
        });

        // Función de limpieza: se ejecuta solo cuando el proveedor se desmonta.
        return () => {
            socket.disconnect();
            setIsConnected(false);
        };
    }, []); // El array vacío asegura que este efecto se ejecute solo una vez.

    /**
     * Efecto para manejar las suscripciones a plantas específicas.
     * Se ejecuta cada vez que `plantId` o `isOnline` cambian.
     */
    useEffect(() => {
        const socket = socketRef.current;
        // Nos aseguramos de que el socket esté inicializado, conectado Y AUTENTICADO.
        if (!socket || !isAuthenticated) {
            return;
        }

        const previousPlantId = lastPlantIdRef.current;

        // Si el ID de la planta ha cambiado y teníamos uno anterior, nos desuscribimos.
        if (previousPlantId && previousPlantId !== plantId) {
            socket.emit("stop", {
                namespace: "vehicle-events",
                objects: [previousPlantId], // La API espera un array
            });
            // Limpiamos el último evento para evitar mostrar datos de la planta anterior.
            setLastEvent(null);
        }

        // Si tenemos un nuevo ID de planta y está online, nos suscribimos.
        if (plantId && isOnline) {
            console.log(`Escuchando eventos para la planta: ${plantId}`);
            socket.emit("listen", {
                namespace: "vehicle-events",
                objects: plantId,
                compact: true,
            });
        }

        // Actualizamos la referencia al ID de la planta actual.
        lastPlantIdRef.current = plantId;

    }, [plantId, isOnline, isAuthenticated]);

    // Proporciona el último evento y el estado de la conexión a los componentes hijos.
    return (
        <PlantDetailSocketContext.Provider value={{ lastEvent, isConnected }}>
            {children}
        </PlantDetailSocketContext.Provider>
    );
};