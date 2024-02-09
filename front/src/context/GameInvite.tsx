import { createContext } from "react";
import { io, Socket } from "socket.io-client";

export const gameInviteSocket = io(process.env.REACT_APP_API_URL + "/gameInvite", {
 withCredentials: true,
 autoConnect: false,
});

export const GameInviteContext = createContext<Socket>(gameInviteSocket);

export const GameInviteProvider = GameInviteContext.Provider;
