import React, { useContext, useEffect, useMemo, useState } from "react";
import { GameContext } from "../../context/GameContext";
import { useRefreshToken } from "../../hooks/useRefreshToken";
import { Link } from "react-router-dom"; // Importe Link para navegar entre as páginas

export const Game = () => {
    const socket = useContext(GameContext);
    const [score1, setScore1] = useState(0);
    const [score2, setScore2] = useState(0);
    const [player1, setPlayer1] = useState("");
    const [player2, setPlayer2] = useState("");
    const [paddle1Y, setPaddle1Y] = useState("");
    const [paddle2Y, setPaddle2Y] = useState("");
    const [paddle3Y, setPaddle3Y] = useState("");
    const [paddle4Y, setPaddle4Y] = useState("");
    const [ballY, setBallY] = useState("");
    const [ballX, setBallX] = useState("");
    const [game, setGame] = useState(false);
    const [winner, setWinner] = useState("");
    const [winnerBool, setWinnerBool] = useState(false);
    const [disconnect, setDisconnect] = useState(false);
    const queryParams = useMemo(() => {
        return new URLSearchParams(window.location.search);
    }, []);
    const [roomId, setRoomId] = useState("");
    const [mode, setMode] = useState("");
    const refreshToken = useRefreshToken();

    useEffect(() => {
        const newroomId = queryParams.get("roomId");
        const newmode = queryParams.get("mode");

        if (newroomId) setRoomId(newroomId);
        else window.location.href = process.env.REACT_APP_WEB_URL + "/Queue";

        if (newmode) setMode(newmode);
        else window.location.href = process.env.REACT_APP_WEB_URL + "/Queue";
    }, [queryParams]);

    const disconnectSocket = () => {
        socket.off("gameSet");
        socket.off("winner");
        socket.off("connect");
        socket.off("jwt_error");
        socket.off("moveUp");
        socket.off("moveDown");
        socket.off("missing_token");
        socket.off("update");
        socket.off("opponentLogout");
        socket.disconnect();
    };

    const connectSocket = () => {
        socket.connect();
        socket.on("connect", () => {
            socket.emit("joinRoom", { roomId: roomId, mode: mode });
            setTimeout(() => {
                setDisconnect(true);
            }, 3000);
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

        socket.on("missing_token", async (error) => {
            disconnectSocket();
            try {
                await refreshToken();
            } catch (error) {
                console.log(error);
                window.location.href = process.env.REACT_APP_WEB_URL + "/login";
            }
            connectSocket();
        });

        socket.on("moveUp", (body) => {
            setPaddle1Y(body.game.paddle1Y + "vh");
            setPaddle2Y(body.game.paddle2Y + "vh");
        });

        socket.on("moveDown", (body) => {
            setPaddle1Y(body.game.paddle1Y + "vh");
            setPaddle2Y(body.game.paddle2Y + "vh");
        });

        socket.on("gameSet", (body) => {
            setScore1(body.game.score1);
            setScore2(body.game.score2);
            setPlayer1(body.game.player1Name);
            setPlayer2(body.game.player2Name);
            setPaddle1Y(body.game.paddle1Y + "vh");
            setPaddle2Y(body.game.paddle2Y + "vh");
            setBallX(body.game.ballX + "vw");
            setBallY(body.game.ballY + "vh");
            if (mode === "hard") {
                setPaddle3Y(body.game.paddle3Y + "vh");
                setPaddle4Y(body.game.paddle4Y + "vh");
            }
            setGame(true);
            socket.emit("startGame", { roomId: roomId });
        });

        socket.on("update", (body) => {
            setScore1(body.game.score1);
            setScore2(body.game.score2);
            setPaddle1Y(body.game.paddle1Y + "vh");
            setPaddle2Y(body.game.paddle2Y + "vh");
            setBallX(body.game.ballX + "vw");
            setBallY(body.game.ballY + "vh");
            if (mode === "hard") {
                setPaddle3Y(body.game.paddle3Y + "vh");
                setPaddle4Y(body.game.paddle4Y + "vh");
            }
        });

        socket.on("winner", (body) => {
            setGame(false);
            setWinnerBool(true);
            setWinner(body.winner);
            setTimeout(() => {
                setDisconnect(true);
            }, 5000);
        });

        socket.on("opponentLogout", () => {
            alert("Opponent disconnected");
        });
    };

    useEffect(() => {
        if (disconnect && !game && !winnerBool) {
            disconnectSocket();
            alert("Time expired");
            window.location.href = "/home";
        } else if (disconnect && winnerBool && !game) {
            disconnectSocket();
            window.location.href = "/home";
        } else {
            setDisconnect(false);
        }
    }, [disconnect]);

    useEffect(() => {
        if (roomId) {
            connectSocket();
            return () => {
                disconnectSocket();
            };
        }
    }, [socket, roomId]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "w") {
                socket.emit("moveUp", { roomId: roomId });
            } else if (event.key === "s") {
                socket.emit("moveDown", { roomId: roomId });
            } else if (event.key === "r") {
                socket.emit("releaseBall", { roomId: roomId });
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key === "w" || event.key === "s") {
                socket.emit("moveStop", { roomId: roomId });
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [roomId, socket]);

    return (
        <>
            {!game && !winnerBool && (
                <>
                    <div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex items-center justify-center relative">
                        <div className="absolute top-0 left-0 right-0 w-32 h-32 mx-auto mt-52 mb-0 bg-white rounded-full animate-bounce "></div>
                        <h1 className="text-4xl font-bold text-center text-white mb-4">
                            WAITING FOR OPPONENT
                        </h1>
                    </div>
                </>
            )}
            <div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex relative">
                {game && (
                    <>
                        <div className="absolute top-[8vh] left-[20vw] w-[60vw] flex justify-between items-center text-[3vw] text-white font-bold font-['Inter'] leading-[44px]">
                            <div className="text-right w-[35vw] mr-[8vw]">
                                {player1}
                            </div>
                            <div className="text-center w-[20vw] text-[6vw]">
                                {score1}x{score2}
                            </div>
                            <div className="text-left w-[35vw] ml-[8vw]">
                                {player2}
                            </div>
                        </div>
                        <div className="w-[60vw] h-[51vh] left-[20vw] top-[24vh] bottom-[24vh] absolute bg-white" />
                        <div
                            className="w-[0.8vw] h-[10vh] left-[23vw] absolute bg-black rounded-full"
                            style={{ top: paddle1Y }}
                        />
                        {mode === "hard" && (
                            <div>
                                <div
                                    className="w-[0.8vw] h-[4vh] left-[36.5vw] absolute bg-black rounded-full"
                                    style={{ top: paddle3Y }}
                                />
                                <div
                                    className="w-[0.8vw] h-[4vh] left-[63.1vw] absolute bg-black rounded-full"
                                    style={{ top: paddle4Y }}
                                />
                            </div>
                        )}
                        <div
                            className="w-[0.6vw] h-[0.6vw] absolute bg-black rounded-full"
                            style={{ left: ballX, top: ballY }}
                        />
                        <div
                            className="w-[0.8vw] h-[10vh] left-[76.2vw] absolute bg-black rounded-full"
                            style={{ top: paddle2Y }}
                        />
                    </>
                )}
                {winnerBool && (
                    <>
                        <div className="absolute top-[8vh] left-[20vw] w-[60vw] flex justify-between items-center text-[3vw] text-white font-bold font-['Inter'] leading-[44px]">
                            <div className="text-right w-[35vw] mr-[8vw]">
                                {player1}
                            </div>
                            <div className="text-center w-[20vw] text-[6vw]">
                                {score1}x{score2}
                            </div>
                            <div className="text-left w-[35vw] ml-[8vw]">
                                {player2}
                            </div>
                        </div>
                        <div className="absolute left-[20vw] top-[24vh] w-[60vw] h-[51vh] bg-white flex items-center justify-center">
                            <div className="w-[10vw] h-[6vw] flex items-center justify-center bg-white">
                                <div className="text-[7vw] text-black text-center">
                                    {winner} wins
                                </div>
                            </div>
                        </div>
                        <Link
                            to="/home"
                            className="absolute left-[50vw] transform -translate-x-1/2 top-[78vh] bg-blue-600 text-white rounded-full px-4 py-2"
                        >
                            Home
                        </Link>
                    </>
                )}
            </div>
        </>
    );
};
