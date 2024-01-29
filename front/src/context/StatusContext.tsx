import { createContext } from "react";
import { io, Socket } from "socket.io-client";

export const statusSocket = io(process.env.REACT_APP_API_URL + "/status", {
 withCredentials: true,
 autoConnect: false,
});

export const StatusContext = createContext<Socket>(statusSocket);

export const StatusProvider = StatusContext.Provider;
