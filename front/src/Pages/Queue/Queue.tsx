import React, { useContext, useEffect, useState } from "react";
import { QueueContext } from "../../context/QueueContext";
import { useRefreshToken } from "../../hooks/useRefreshToken";
import { GameInviteContext } from "../../context/GameInvite";

export const QueueGame = () => {
    const socket = useContext(QueueContext);
    const refreshToken = useRefreshToken();
    const gameInviteSocket = useContext(GameInviteContext);
    const [search, setSearch] = useState(false);
    const [normalMap, setNormalMap] = useState(false);
    const [hardMap, setHardMap] = useState(false);
    const [stickBall, setStickBall] = useState(false);

    const connectSocket = () => {
        socket.connect();
        socket.on("connect", () => {
        });

        socket.on("jwt_error", async (error) => {
            console.log(`Connection failed due to ${error.message}`);
            console.log("Tentando Reautenticar");
            disconnectSocket();
            try {
                await refreshToken();
            } catch (error) {
                console.log(error);
                window.location.href = process.env.REACT_APP_WEB_URL + "/login";
            }
            connectSocket();
        });

        socket.on("missing_token", async () => {
            disconnectSocket();
            try {
                await refreshToken();
            } catch (error) {
                console.log(error);
                window.location.href = process.env.REACT_APP_WEB_URL + "/login";
            }
            connectSocket();
        });

        socket.on("joinGame", (response) => {
            if (response.roomId === undefined) {
                disconnectSocket();
                connectSocket();
            }
            disconnectSocket();
            window.location.href =
                process.env.REACT_APP_WEB_URL + "/Game?roomId=" +
                response.roomId +
                "&mode=" +
                response.mode;
        });
    };

    const disconnectSocket = () => {
        socket.off("connect");
        socket.off("jwt_error");
        socket.off("joinedQueue");
        socket.off("joinGame");
        socket.off("missing_cookie");
        socket.disconnect();
    };

    useEffect(() => {
        connectSocket();
        return () => {
            disconnectSocket();
        };
    }, [socket]);

    const connectGameInviteSocket = () => {
        gameInviteSocket.connect();
        gameInviteSocket.on("connect", () => {
        });

        gameInviteSocket.on("jwt_error", async (error) => {
            console.log(`Connection failed due to ${error.message}`);
            console.log("Tentando Reautenticar");
            disconnectSocket();
            try {
                await refreshToken();
            } catch (error) {
                console.log(error);
                window.location.href = process.env.REACT_APP_WEB_URL + "/login";
            }
            connectSocket();
        });

        gameInviteSocket.on("missing_token", async () => {
            disconnectSocket();
            try {
                await refreshToken();
            } catch (error) {
                console.log(error);
                window.location.href = process.env.REACT_APP_WEB_URL + "/login";
            }
            connectSocket();
        });

        gameInviteSocket.on("joinGame", (response) => {
            if (response.roomId === undefined) {
                disconnectSocket();
                connectSocket();
            }
            console.log(response.roomId);
            disconnectSocket();
            window.location.href =
                process.env.REACT_APP_WEB_URL + "/Game?roomId=" +
                response.roomId +
                "&mode=" +
                response.mode;
        });
    };

    const disconnectGameInviteSocket = () => {
        gameInviteSocket.off("connect");
        gameInviteSocket.off("jwt_error");
        gameInviteSocket.off("missing_cookie");
        gameInviteSocket.disconnect();
    };

    useEffect(() => {
        connectGameInviteSocket();
        return () => {
            disconnectGameInviteSocket();
        };
    }, [gameInviteSocket]);

    const joinQueue = () => {
        const gameModes = [];
        if (normalMap) {
            gameModes.push("normal");
        }
        if (hardMap) {
            gameModes.push("hard");
        }
        if (stickBall) {
            gameModes.push("stick");
        }
        if (gameModes.length > 0) {
            socket.emit("joinQueue", { gameModes });
        } else {
            setSearch(false);
        }
    };

    useEffect(() => {
        if (search) {
            joinQueue();
        }
    }, [search]);

    return (
        <>
            <div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex items-center justify-center relative">
                {search && (
                    <div>
                        <div className="absolute top-0 left-0 right-0 w-32 h-32 mx-auto mt-52 mb-0 bg-white rounded-full animate-bounce "></div>
                        <h1 className="text-4xl font-bold text-center text-white mb-4">
                            SEARCHING PLAYERS
                        </h1>
                    </div>
                )}
                {!search && (
                    <div>
                        <div className="flex flex-col items-center justify-center h-screen">
                            <h1 className="text-4xl font-bold mb-[15vh] text-white">
                                Select game modes:
                            </h1>
                            <div className="flex space-x-4 mb-[15vh]">
                                <button
                                    className={`transform hover:scale-105 font-bold rounded-full py-4 px-8 shadow-lg uppercase tracking-wider text-3vh ${
                                        normalMap
                                            ? "border-2 border-white bg-black text-white"
                                            : "bg-black text-white"
                                    }`}
                                    onClick={() => {
                                        setNormalMap(!normalMap);
                                    }}
                                >
                                    Normal Map
                                </button>
                                <button
                                    className={`transform hover:scale-105 font-bold rounded-full py-4 px-8 shadow-lg uppercase tracking-wider text-3vh ${
                                        hardMap
                                            ? "border-2 border-white bg-black text-white"
                                            : "bg-black text-white"
                                    }`}
                                    onClick={() => {
                                        setHardMap(!hardMap);
                                    }}
                                >
                                    Hard Map
                                </button>
                                <button
                                    className={`transform hover:scale-105 font-bold rounded-full py-4 px-8 shadow-lg uppercase tracking-wider text-3vh ${
                                        stickBall
                                            ? "border-2 border-white bg-black text-white"
                                            : "bg-black text-white"
                                    }`}
                                    onClick={() => {
                                        setStickBall(!stickBall);
                                    }}
                                >
                                    Stick Ball
                                </button>
                            </div>
                            <button
                                className="transform hover:scale-105 bg-black text-white font-bold rounded-full py-4 px-8 shadow-lg uppercase tracking-wider text-3vh"
                                onClick={() => {
                                    setSearch(!search);
                                }}
                            >
                                Play
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
