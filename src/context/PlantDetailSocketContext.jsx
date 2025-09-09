import { createContext, useEffect, useState } from "react";
import io from "socket.io-client";

export const PlantDetailSocketContext = createContext();

export const PlantDetailSocketProvider = ({ children, plantId, isOnline }) => {
    const [lastEvent, setLastEvent] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    useEffect(() => {
        let socket;

        if (plantId && isOnline) {
            socket = io("https://aws-live-1.pegasusgateway.com/socket", {
                transports: ["websocket"],
            });

            const credentials = {
                pegasus: "https://rastreo.totaltracking.co",
                auth: sessionStorage.getItem("token"),
            };

            socket.on("connect", () => {
                if (!isOnline) return; 
                setIsConnected(true);
                console.log("Socket conectado");
                socket.emit("authenticate", credentials);
            });

            socket.on("_authenticated", () => {
                console.log("Autenticado en socket");
                socket.emit("listen", {
                    namespace: "vehicle-events",
                    objects: plantId,
                    compact: true,
                });
            });

            socket.on("events", (envelope) => {
                setLastEvent(envelope);
            });

            socket.on("disconnect", () => {
                setIsConnected(false);
                console.warn("Socket desconectado");
            });

            socket.on("connect_error", (err) => {
                console.error("Error de conexión:", err.message);
            });

            socket.on("_error", (message) => {
                console.error("Error de autenticación:", message);
            });
        } else {
            console.log("Dispositivo offline, no conectar socket");
        }
        return () => {
            if (socket) {
                socket.removeAllListeners();
                if (socket.connected || socket.connecting) {
                    console.log("Cerrando socket...");
                    socket.disconnect();
                } else {
                    console.log("Socket nunca terminó de conectar, no hay nada que cerrar");
                }
            }
            setIsConnected(false);
        };
    }, [plantId, isOnline]);

    return (
        <PlantDetailSocketContext.Provider value={{ lastEvent, isConnected }}>
            {children}
        </PlantDetailSocketContext.Provider>
    );
};