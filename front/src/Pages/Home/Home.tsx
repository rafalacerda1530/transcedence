import React, { useContext, useEffect, useState } from "react";
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate";
import axios from "axios";
import { StatusContext } from "../../context/StatusContext";
import { useRefreshToken } from "../../hooks/useRefreshToken";

import ToggleSwitch from "./button/toggle";
import Modal from "react-modal";
Modal.setAppElement("#root");

const customStyles = {
  content: {
    width: "60%",
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#000",
    color: "#fff",
    borderRadius: "10px 10px 10px 10px",
  },
  header: {},
};

export const Home = () => {
  interface UserData {
    id: number;
    user: string;
    nickname: string;
    email: string;
    profileImage: string;
  }
  interface Amigo {
    id: number;
    user: string;
    status: string;
  }
  const getStatusColor = (status: string) => {
    return status === "Online" ? "green" : "red";
  };

  const [modalIsOpen, setIsOpen] = useState(false);
  const [modalSolicitacoesIOpen, setSolicitacoesOpen] = useState(false);
  const [solicitacoesData, setSolicitacoesData] = useState<Amigo[]>([]);
  const [amigosData, setAmigosData] = useState<Amigo[]>([]);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const openModalSolicitacoes = () => {
    setSolicitacoesOpen(true);
  };

  const closeModalSolicitacoes = () => {
    setSolicitacoesOpen(false);
  };
  const handleSolicitacoes = async () => {
    if (username) {
      const url = "/friendship/Pendentes/" + username;
      try {
        const response = await axiosPrivate.get(url);
        setSolicitacoesData(response.data);
        openModalSolicitacoes(); // Move this line outside of the try block
      } catch (error) {
        console.log("Erro ao obter dados dos amigos:", error);
      }
    }
  };
  const handleAmigos = async () => {
    if (username) {
      const url = "/friendship/" + username;

      try {
        const response = await axiosPrivate.get(url);
        if (response.data.length > 0) {
          setAmigosData(response.data);
          openModal(); // Move this line outside of the try block
        } else {
          alert("nao tem amigos!");
        }
      } catch (error) {
        console.log("Erro ao obter dados dos amigos:", error);
      }
    }
  };

  const defaultPhoto = "https://i.imgur.com/VavB8Rm.png";
  const statusSocket = useContext(StatusContext);
  const refreshToken = useRefreshToken();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedNickname, setEditedNickname] = useState("");
  const [isProfileSectionVisible, setIsProfileSectionVisible] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const connectSocket = () => {
    statusSocket.connect();
    statusSocket.on("connect", () => {
      console.log("Conectado ao socket");
    });

    statusSocket.on("jwt_error", async (error) => {
      console.log(`Connection failed due to ${error.message}`);
      console.log("Tentando Reautenticar");
      disconnectSocket();
      try {
        await refreshToken();
      } catch (error) {
        console.log(error);
        window.location.href = "http://localhost:3000/login";
      }
      connectSocket();
    });

    statusSocket.on("missing_token", async () => {
      disconnectSocket();
      try {
        await refreshToken();
      } catch (error) {
        console.log(error);
        window.location.href = "http://localhost:3000/login";
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
      console.log("Desconectando do socket");
      disconnectSocket();
    };
  }, [statusSocket]);

  const [ativo, setAtivo] = useState(false);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedName(userData?.user || "");
    setEditedEmail(userData?.email || "");
    setEditedNickname(userData?.nickname || "");
  };

  const handlePesquisarHistorico = async (user?: string) => {
    if (user === "") window.location.href = `/matchHistoryComplete/$+ `;
    else window.location.href = `/matchHistoryComplete/${user}`;
  };

  const handleGerarQrCode = () => {
    window.location.href = `/generate2fa`;
  };

  const handleIniciarJogo = async (user?: string) => {
    window.location.href = `/Queue`;
  };

  const handleLogout = async () => {
    try {
      const response = await axiosPrivate.post("/user/logout");
      window.location.href = `/login`;
    } catch (error) {
      console.log(error);
    }
  };

  const handleSaveClick = async () => {
    try {
      const IdData = await axiosPrivate.get("/user/me");
      const userId = IdData.data.userId;

      const newData = {
        userId: userId,
        user: editedName,
        email: editedEmail,
        nickname: editedNickname,
      };

      const userResponse = await axiosPrivate.patch(
        "/user/updateProfile",
        newData
      );

      setUserData({
        id: userResponse.data.user.userId,
        user: userResponse.data.user.user,
        email: userResponse.data.user.email,
        nickname: userResponse.data.user.nickname,
        profileImage: userResponse.data?.profileImage,
      });
      // Saia do modo de edição
      setIsEditing(false);
      // Alterne a visibilidade das seções
      setIsProfileSectionVisible(!isProfileSectionVisible);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Mensagem de erro:", error.response.data.message);
        setErrorMessage(error.response.data.message);
      }
    }
  };

  const [showBall, setShowBall] = useState(false);
  const [username, setUserName] = useState("");
  const axiosPrivate = useAxiosPrivate();
  const [searchTerm, setSearchTerm] = useState("");
  const [userStats, setUserStats] = useState({
    win: 0,
    lose: 0,
    score: 0,
  });

  useEffect(() => {
    // Move the modal opening logic outside of the useEffect
    if (amigosData.length > 0) {
      openModal();
    }
  }, [amigosData]);
  useEffect(() => {
    // Move the modal opening logic outside of the useEffect
    if (solicitacoesData.length > 0) {
      openModalSolicitacoes();
    }
  }, [solicitacoesData]);

  useEffect(() => {
    const user = async () => {
      try {
        const response = await axiosPrivate.get("/user/me");
        setUserName(response.data?.user);

        const userHistoryResponse = await axiosPrivate.get("/user/meHistory");
        const { win, lose, score } = userHistoryResponse.data;

        setUserStats({
          win: win || 0,
          lose: lose || 0,
          score: score || 0,
        });

        return response.data;
      } catch (error) {
        console.log(error);
        window.location.href = "http://localhost:3000/Login";
      }
    };
    user();
  }, [axiosPrivate]);

  let image = "";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosPrivate.get("/user/me");
        setUserData({
          id: response.data.userId,
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

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Obter dados do usuário
        const userResponse = await axiosPrivate.get("/user/me");
        const userData = userResponse.data;

        // Extrair o valor do usuário retornado
        const user = userData.user;

        // Realizar o upload da imagem com o valor do usuário
        const formData = new FormData();
        formData.append("profileImage", file); // 'file' é o arquivo de imagem
        formData.append("user", user); // Adicionar o usuário ao FormData

		
        // Enviar a requisição POST para o backend
        const uploadResponse = await axiosPrivate.post(
          "/user/uploadImage",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("Imagem enviada com sucesso:", formData);
      } catch (error) {
        console.error("Erro ao enviar a imagem:", error);
      }
    } else {
      console.log("Nenhum arquivo selecionado!");
    }
  };

  const handleStatus = async (status: number, amigoId: any) => {
    if (status == 1) {
      try {
        console.log("cliquei:", status, amigoId);
        // @Post(':userId/add/:friendId')
        const uploadResponse = await axiosPrivate.post(
          `friendship/${userData?.id}/accept/${amigoId}`
        );

        console.log("Solicitacao aceita com sucesso:", uploadResponse.data);
        closeModal();
      } catch (error) {
        console.log(error);
      }
    }
    console.log(status);
    if (status == 0) {
      try {
        console.log("cliquei:", status, amigoId);
        console.log("eu:", userData);
        // @Post(':userId/add/:friendId')

        const uploadResponse = await axiosPrivate.post(
          `friendship/${userData?.id}/reject/${amigoId}`
        );

        console.log("Solicitacao aceita com sucesso:", uploadResponse.data);
        closeModal();
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex items-center justify-center">
      <div className="flex gap-8">
        {/* Seção do perfil */}
        <div
          className={`bg-black text-white p-8 rounded-lg border border-gray-700 max-w-md ${
            isEditing ? "center-profile-editing" : "center-profile"
          }`}
        >
          {userData && (
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold mb-4 flex items-center justify-center">
                Seu Perfil{" "}
                {isEditing ? (
                  <span
                    className="ml-2 cursor-pointer text-base"
                    onClick={handleSaveClick}
                  >
                    &#x1F4BE;
                  </span>
                ) : (
                  <span
                    className="ml-2 cursor-pointer text-base"
                    onClick={handleEditClick}
                  >
                    &#x1F589;
                  </span>
                )}
              </h1>
              {/* Restante da seção do perfil */}
              <div className="mb-4">
                <strong>Nome:</strong>{" "}
                {isEditing ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-black border border-gray-500 rounded p-2"
                    readOnly={!isEditing}
                    style={{ width: "100%" }}
                  />
                ) : (
                  <span className="text-gray-500">{userData.user}</span>
                )}
              </div>
              <div className="mb-6">
                <strong>Email:</strong>{" "}
                {isEditing ? (
                  <>
                    <input
                      type="mail"
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      className="text-black border border-gray-500 rounded p-2"
                      readOnly={!isEditing}
                      style={{ width: "100%" }}
                    />{" "}
                    {errorMessage && (
                      <p className="text-red-500 text-center mt-2">
                        {errorMessage}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-gray-500">{userData.email}</span>
                )}
              </div>
              <div className="mb-6">
                <strong>Nickname:</strong>{" "}
                {isEditing ? (
                  <>
                    <input
                      type="name"
                      value={editedNickname}
                      onChange={(e) => setEditedNickname(e.target.value)}
                      className="text-black border border-gray-500 rounded p-2"
                      readOnly={!isEditing}
                      style={{ width: "100%" }}
                    />{" "}
                    {errorMessage && (
                      <p className="text-red-500 text-center mt-2">
                        {errorMessage}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-gray-500">{userData.nickname}</span>
                )}
              </div>
              <div className="mb-4">
                <img
                    src="https://i.imgur.com/VavB8Rm.png"
                  alt="Profile"
                  className="w-20 h-20 rounded-full mx-auto mb-4"
                />
                <input
                  type="file"
                  id="file"
                  className="hidden"
                  onChange={(e) => handleFileChange(e)}
                />
                {isEditing && (
                  <label
                    htmlFor="file"
                    className="block text-white rounded-full px-4 py-2 cursor-pointer"
                    style={{ width: "100%" }}
                  >
                    Alterar Foto
                  </label>
                )}
                {/* Seção do Toggle button de autenticação 2fa */}
                <div className="flex items-center mb-2 font-bold text-sm">
                  <div className="mr-2  mb-7 ">
                    <ToggleSwitch />
                  </div>
                  2FA - AUTHENTICATION
                </div>
                <div className=" ">
                  <button
                    className="bg-blue-600 text-white mt-2 mr-2 rounded-full px-2 py-2 "
                    onClick={() => handleGerarQrCode()}
                  >
                    Novo Qr-Code
                  </button>
                  <button
                    className="bg-blue-600 text-white mt-2 rounded-full px-2 py-2 "
                    onClick={handleSolicitacoes}
                  >
                    Ver solicitações de amizade
                  </button>
                  <Modal
                    isOpen={modalSolicitacoesIOpen}
                    onRequestClose={closeModalSolicitacoes}
                    style={customStyles}
                    contentLabel="Example Modal"
                  >
                    <header>
                      <button onClick={closeModalSolicitacoes}>x</button>
                    </header>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              padding: "10px",
                              textAlign: "left",
                              borderBottom: "1px solid #ddd",
                            }}
                          >
                            Amigos
                          </th>
                          <th
                            style={{
                              padding: "10px",
                              textAlign: "left",
                              borderBottom: "1px solid #ddd",
                            }}
                          >
                            Açôes
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {solicitacoesData.map((amigo) => (
                          <tr key={amigo.id}>
                            <td
                              style={{
                                padding: "10px",
                                borderBottom: "1px solid #ddd",
                              }}
                            >
                              {amigo.user}
                            </td>
                            <td
                              style={{
                                padding: "10px",
                                borderBottom: "1px solid #ddd",
                              }}
                            >
                              <button
                                className="bg-blue-600 text-white mt-2 mr-2 rounded-full px-2 py-2 "
                                onClick={(e) => handleStatus(1, amigo.id)}
                              >
                                aceitar
                              </button>
                              <button
                                className="bg-blue-600 text-white mt-2 mr-2 rounded-full px-2 py-2 "
                                onClick={(e) => handleStatus(0, amigo.id)}
                              >
                                rejeitar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Modal>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Seção para iniciar o jogo */}
        {!isEditing && (
          <>
            <div className="bg-black text-white p-8 rounded-lg border border-gray-700 max-w-md">
              <div className="text-center mb-4">
                <h1 className="text-4xl font-bold mb-4">
                  {username} SEJA BEM-VINDO AO PONG GAME
                </h1>
                <p className="mb-4">
                  Desafie seus amigos em uma partida emocionante de Ping Pong!
                </p>

                <div className="flex flex-col items-center">
                  <button
                    className="bg-blue-600 text-white rounded-full px-4 py-2 mb-4"
                    onClick={() => handleIniciarJogo()}
                  >
                    Iniciar Jogo
                  </button>
                  <div className="text-black">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Digite o Player"
                      className="border border-gray-400 p-2 mb-4 rounded-md w-full"
                    />
                    <button
                      className="bg-blue-600 text-white rounded-full mr-2 px-4 py-2 mb-4"
                      onClick={() => handlePesquisarHistorico(searchTerm)}
                    >
                      Pesquisar Histórico
                    </button>
                    <button
                      className="bg-blue-600 text-white rounded-full px-4 py-2 mb-4"
                      onClick={handleAmigos} // Change to call handleAmigos instead of openModal directly
                    >
                      Ver amigos
                    </button>

                    <Modal
                      isOpen={modalIsOpen}
                      onRequestClose={closeModal}
                      style={customStyles}
                      contentLabel="Example Modal"
                    >
                      <header>
                        <button onClick={closeModal}>x</button>
                      </header>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse", // Adicionei para melhorar a aparência das bordas da tabela
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              style={{
                                padding: "10px",
                                textAlign: "left",
                                borderBottom: "1px solid #ddd",
                              }}
                            >
                              Amigos
                            </th>
                            <th
                              style={{
                                padding: "10px",
                                textAlign: "left",
                                borderBottom: "1px solid #ddd",
                              }}
                            >
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {amigosData.map((amigo) => (
                            <tr key={amigo.id}>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #ddd",
                                }}
                              >
                                {amigo.user}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #ddd",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      width: "10px",
                                      height: "10px",
                                      borderRadius: "50%",
                                      backgroundColor: getStatusColor(
                                        amigo.status
                                      ),
                                      display: "inline-block",
                                      marginRight: "5px",
                                    }}
                                  />
                                  {amigo.status === "Online"
                                    ? "Online"
                                    : "Offline"}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Modal>
                  </div>
                </div>
              </div>
              <div className="flex items-center ">
                <div className="ml-5 ">
                  <button onClick={() => handleLogout()}>
                    <div className="flex items-center w-8 h-8 rounded-full mx-auto ">
                      <img
                        src="https://png.pngtree.com/png-clipart/20191120/original/pngtree-exit-door-glyph-icon-vector-png-image_5079301.jpg"
                        alt="Profile"
                        className="w-8 h-8 rounded-full mx-auto mr-6"
                      />
                      <span className=" font-bold  text-base">Logout</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Seção para estatisticas */}
            <div className="bg-black text-white p-8 rounded-lg border border-gray-700 max-w-md">
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
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
