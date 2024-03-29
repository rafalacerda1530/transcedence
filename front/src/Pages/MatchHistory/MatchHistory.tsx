import { AxiosResponse } from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { axiosPrivate } from "../../hooks/useAxiosPrivate";
import { useRefreshToken } from "../../hooks/useRefreshToken";
import { StatusContext } from "../../context/StatusContext";
import { GameInviteContext } from "../../context/GameInvite";

interface MatchHistoryItem {
    Partida: string;
    Pontos_Player1: string;
    Pontos_Player2: string;
    Vencedor: string;
}

interface UserData {
    userId: number;
    user: string;
    nickname: string;
    email: string;
    profileImage: string;
}
const handleHomeButton = () => {
    window.location.href = process.env.REACT_APP_WEB_URL + "/home";
};

export const MatchHistoryComplete = () => {
    const { user } = useParams<{ user: string }>();
    const [history, setHistory] = useState<Record<string, MatchHistoryItem>>(
        {}
    );
    const [showBall, setShowBall] = useState(true);
    const statusSocket = useContext(StatusContext);
    const refreshToken = useRefreshToken();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [meData, setMeData] = useState<UserData | null>(null);
    const [userStats, setUserStats] = useState({
        win: 0,
        lose: 0,
        score: 0,
    });
    const [username, setUserName] = useState("");
    const gameInviteSocket = useContext(GameInviteContext);

    const connectSocket = () => {
        statusSocket.connect();
        statusSocket.on("connect", () => {
        });

        statusSocket.on("jwt_error", async (error) => {
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

        statusSocket.on("missing_token", async () => {
            disconnectSocket();
            try {
                await refreshToken();
            } catch (error) {
                console.log(error);
                window.location.href = process.env.REACT_APP_WEB_URL + "/login";
            }
            connectSocket();
        });
    };

    const disconnectSocket = () => {
        statusSocket.off("connect");
        statusSocket.off("jwt_error");
        statusSocket.off("missing_cookie");
        statusSocket.disconnect();
    };

    useEffect(() => {
        connectSocket();
        return () => {
            disconnectSocket();
        };
    }, [statusSocket]);

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

    let image = "";
    const fetchUserData = async (response: AxiosResponse<UserData>) => {
        try {
            setUserData({
                userId: response.data?.userId,
                user: response.data?.user,
                email: response.data?.email,
                nickname: response.data?.nickname,
                profileImage: response.data?.profileImage,
            });
            // Certifique-se de declarar 'image' corretamente com const ou let
            const image = response.data?.profileImage;
            // Faça algo com 'image' aqui, se necessário
        } catch (error) {
            console.log(error);
        }
    };
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axiosPrivate.get("/user/me");
                setMeData({
                    userId: response.data.userId,
                    user: response.data?.user,
                    email: response.data?.email,
                    nickname: response.data?.nickname,
                    profileImage: response.data?.profileImage,
                });
                image = response.data?.profileImage;
            } catch (error) {
                console.log(error);
            }
        };

        fetchUserData();
    }, [axiosPrivate, setUserData]);
    const CallBackMatchAll = (userId?: string) => {
        return axiosPrivate
            .get("user/matchHistory", {
                params: { user: userId },
                withCredentials: true,
            })
            .then((response) => {
                return response;
            })
            .catch((error) => {
                console.log(error);
                throw error;
            });
    };

    const CallBackUserInfo = (userId?: string) => {
        return axiosPrivate
            .get("user/meInfo", {
                params: { user: userId },
                withCredentials: true,
            })
            .then((response) => {
                return response;
            })
            .catch((error) => {
                console.log(error);
                throw error;
            });
    };

    const CallBackMatchHistory = (userId?: string) => {
        return axiosPrivate
            .get("user/getUserHistoryComplete", {
                params: { user: userId },
                withCredentials: true,
            })
            .then((response) => {
                return response;
            })
            .catch((error) => {
                console.log(error);
                throw error;
            });
    };
    const handleAddFriend = async (userId: any, friendId: any) => {
        try {
            // Enviar a requisição POST para o backend
            const uploadResponse = await axiosPrivate.post(
                `friendship/${userId}/add/${friendId}`
            );

        } catch (error) {
            console.error("Erro ao enviar a solicitacao:", error);
        }
    };

    const matchHistory = async () => {
        try {
            const response = await CallBackMatchAll(user);
            setUserName(response.data?.user?.toUpperCase() + ",");

            const { win, lose, score } = response.data;

            setUserStats({
                win: win || 0,
                lose: lose || 0,
                score: score || 0,
            });

            return response.data;
        } catch (error) {
            console.log(error);
            window.location.href = process.env.REACT_APP_WEB_URL + "/Login";
        }
    };

    useEffect(() => {
        const AllHistory = async () => {
            try {
                const responseUser = await CallBackUserInfo(user);
                const response = await CallBackMatchHistory(user);
                fetchUserData(responseUser);
                matchHistory();
                const batata = responseUser.data.user;
                setHistory(response.data.history);
            } catch (error) {
                console.log(error);
            }
        };

        AllHistory();
    }, []);
    return (
        <div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex items-center justify-center">
            <div className="flex gap-5">
                <div className="bg-black text-white p-8 rounded-lg border border-gray-700 max-w-md">
                    <div className="mb-2">
                        <strong>Nickname:</strong>{" "}
                        <span className="text-gray-500">{userData?.user}</span>
                    </div>
                    <div className="mb-2">
                        <strong>Email:</strong>{" "}
                        <span className="text-gray-500">{userData?.email}</span>
                    </div>
                    <div className=" mb-20">
                        <strong>Nickname:</strong>{" "}
                        <span className="text-gray-500">
                            {userData?.nickname}
                        </span>
                    </div>
                    <div className="mb-4">
                        <img
                            src="https://i.imgur.com/VavB8Rm.png"
                            alt="Profile"
                            className="w-20 h-20 rounded-full mx-auto mb-4"
                        />
                    </div>
                </div>

                {/* Seção para estatísticas */}
                <div className="bg-black text-white p-8 rounded-lg border border-gray-700 max-w-md ml-4">
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-bold mb-4">
                            Estatísticas do Usuário
                        </h1>
                        <div className="mb-4 flex flex-col items-center justify-center">
                            <div className="flex flex-col items-center mb-4">
                                <div className="w-16 h-16 bg-green-500 rounded-full mb-2"></div>
                                <strong>Vitórias:</strong> {userStats.win}
                            </div>
                            <div className="flex flex-col items-center mb-4">
                                <div className="w-16 h-16 bg-red-500 rounded-full mb-2"></div>
                                <strong>Derrotas:</strong> {userStats.lose}
                            </div>
                            <div className="flex flex-col items-center">
                                <strong className="text-yellow-500 text-xl">
                                    Pontuação:
                                </strong>
                                <div className="bg-yellow-500 text-black rounded-lg p-4 mt-2 text-2xl font-bold">
                                    {userStats.score}
                                </div>
                            </div>
                        </div>
                        <div className="mb-">
                            <button
                                type="button"
                                className="text-white font-bold bg-blue-600 text-white rounded-full px-8 py-2"
                                onClick={handleHomeButton}
                            >
                                Home
                            </button>
                            <button
                                type="button"
                                className="text-white font-bold bg-blue-600 text-white rounded-full px-8 py-2"
                                onClick={() =>
                                    handleAddFriend(
                                        meData?.userId,
                                        userData?.userId
                                    )
                                }
                            >
                                Enviar Solicitação
                            </button>
                        </div>
                    </div>
                </div>
                {/*SEÇÃO hISTÓRICO DE PARTIDAS*/}
                <div className="bg-black text-white p-8 rounded-lg border border-gray-700 max-w-md">
                    <div className="text-center">
                        <h1 className="text-blue-500 text text-4xl font-bold mb-4">
                            Histórico de partidas
                        </h1>
                        <div className=" flex flex-col items-center justify-center">
                            {Object.keys(history).map((key) => (
                                <div key={key} className="mb-5 font-bold">
                                    <p>Partida: {history[key].Partida}</p>
                                    <p>{history[key].Pontos_Player1}</p>
                                    <p>{history[key].Pontos_Player2}</p>
                                    <p>{history[key].Vencedor}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
