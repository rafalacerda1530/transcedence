import React, { useContext, useEffect, useMemo, useState } from "react";
import { GameContext } from "../../context/GameContext";

export const Game = () => {
  const socket = useContext(GameContext);
	const queryParams = useMemo(() => {
		return new URLSearchParams(window.location.search);
	}, []);
	const [opponentId, setOpponentId] = useState("");


	useEffect(() => {
		const newOpponentId = queryParams.get("opponentId");
		if (newOpponentId)
			setOpponentId(newOpponentId);
	}, [queryParams]);

	const connectSocket = () => {
		console.log(opponentId);
		socket.emit("moveUp", {opponentId: opponentId, move: "up"});
		socket.emit("moveDown", {opponentId: opponentId, move: "down"});
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
