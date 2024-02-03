import { createContext } from "react";
import { io, Socket } from "socket.io-client";

export const chatSocket = io(process.env.REACT_APP_API_URL + "/chat", {
    withCredentials: true,
    autoConnect: false,
});

export const ChatContext = createContext<Socket>(chatSocket);

export const ChatProvider = ChatContext.Provider;
