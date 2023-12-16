import { createContext } from "react";
import { io, Socket } from "socket.io-client";

export const gameSocket = io("http://localhost:3333/game", {
 withCredentials: true,
 autoConnect: false,
});

export const GameContext = createContext<Socket>(gameSocket);

export const GameProvider = GameContext.Provider;
