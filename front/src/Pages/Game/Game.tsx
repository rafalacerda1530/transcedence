import React, { useContext, useEffect, useMemo, useState } from "react";
import { GameContext } from "../../context/GameContext";
import { useRefreshToken } from "../../hooks/useRefreshToken";

export const Game = () => {
  const socket = useContext(GameContext);
	const queryParams = useMemo(() => {
		return new URLSearchParams(window.location.search);
	}, []);
	const [roomId, setRoomId] = useState("");
  const refreshToken = useRefreshToken();


	useEffect(() => {
		const newroomId = queryParams.get("roomId");
		if (newroomId)
			setRoomId(newroomId);
		else
			window.location.href = 'http://localhost:3000/Queue';
	}, [queryParams]);

	const connectSocket = () => {
		if (roomId){
			socket.connect();
			socket.on("connect", () => {
				console.log("Conectado ao socket");
				console.log(roomId);
				socket.emit("joinRoom", { roomId: roomId });
				socket.emit("moveUp", { roomId: roomId });
				socket.emit("moveDown", { roomId: roomId });
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

			socket.on("moveUp", () => {
				console.log("Opponent Moved Up");
			});

			socket.on("moveDown", () => {
				console.log("Opponent Moved Down");
			});
		}
	};

	const disconnectSocket = () => {
		if (roomId){
			socket.off('connect');
			socket.off('jwt_error');
			socket.off("moveUp");
			socket.off("moveDown");
			socket.disconnect();
		}
	};

	useEffect(() => {
		connectSocket();
		return () => {
			console.log("Desconectando do socket");
			disconnectSocket();
		}
	}, [socket, roomId]);

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
function refreshToken() {
  throw new Error("Function not implemented.");
}
