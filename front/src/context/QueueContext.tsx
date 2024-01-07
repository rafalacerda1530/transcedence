import { createContext } from "react";
import { io, Socket } from "socket.io-client";

export const queueSocket = io(process.env.REACT_APP_API_URL + "/queue", {
 withCredentials: true,
 autoConnect: false,
});

export const QueueContext = createContext<Socket>(queueSocket);

export const QueueProvider = QueueContext.Provider;
