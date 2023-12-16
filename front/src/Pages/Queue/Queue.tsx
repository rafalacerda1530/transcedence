import React, { useContext, useEffect } from "react";
import { GameContext } from "../../context/GameContext";
import { useRefreshToken } from "../../hooks/useRefreshToken";

export const QueueGame = () => {
    const socket = useContext(GameContext);
    const refreshToken = useRefreshToken();

    const connectSocket = () => {
        socket?.connect();
        socket?.on("connect", () => {
            console.log("Conectado ao socket");
            socket.emit("joinQueue");
        });

        socket.on("jwt_error", async (error) => {
            console.log(`Connection failed due to ${error.message}`);
            console.log("Tentando Reautenticar");
            disconnectSocket();
            try {
                await refreshToken();
            } catch (error) {
                console.log(error);
                window.location.href = 'http://localhost:3000/login';
            }
            connectSocket();
        });

        socket.on("joinGame", (response) => {
            console.log("Conectado ao jogo");
            if (response.opponentId === undefined) {
                console.log("opponentId undefined");
                disconnectSocket();
                connectSocket();
            }
            console.log(response.opponentId);
            socket.off('connect');
            socket.off('jwt_error');
            socket.off("joinedQueue");
            socket.off("joinGame");
            console.log(socket.id);
            window.location.href = ('http://localhost:3000/Game?opponentId=' + response.opponentId);
        });
    };

    const disconnectSocket = () => {
        socket.off('connect');
        socket.off('jwt_error');
        socket.off("joinedQueue");
        socket.off("joinGame");
        socket.disconnect();
    };

    useEffect(() => {
        connectSocket();
        return () => {
            console.log("Desconectando do socket");
            disconnectSocket();
        }
    }, [socket]);

    return (
    <>
      <div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex items-center justify-center relative">
                <div className="absolute top-0 left-0 right-0 w-32 h-32 mx-auto mt-52 mb-0 bg-white rounded-full animate-bounce ">
                {/*bola de ping pong */}
                </div>
                <h1 className="text-4xl font-bold text-center text-white mb-4">
                    SEARCHING PLAYERS
                </h1>
      </div>
    </>
  );
}
