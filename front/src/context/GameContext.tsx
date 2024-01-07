import { createContext } from "react";
import { io, Socket } from "socket.io-client";

export const gameSocket = io(process.env.REACT_APP_API_URL + "/game", {
 withCredentials: true,
 autoConnect: false,
});

export const GameContext = createContext<Socket>(gameSocket);

export const GameProvider = GameContext.Provider;
