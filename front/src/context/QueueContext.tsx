import { createContext } from "react";
import { io, Socket } from "socket.io-client";

export const queueSocket = io("http://localhost:3333/queue", {
 withCredentials: true,
 autoConnect: false,
});

export const QueueContext = createContext<Socket>(queueSocket);

export const QueueProvider = QueueContext.Provider;
