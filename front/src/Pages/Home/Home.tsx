import React, { useContext, useEffect, useState } from "react";
import pingPongBall from "./pingPongBall.png"; // Importe uma imagem de uma bola de ping pong
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate";
import { Link } from "react-router-dom"; // Importe Link para navegar entre as páginas

export const Home = () => {
  interface UserData {
    user: string;
    email: string;
    profileImage: string;
  }

  const [userData, setUserData] = useState<UserData | null>(null);

  const [showBall, setShowBall] = useState(false);
  const [username, setUserName] = useState("");
  const axiosPrivate = useAxiosPrivate();

  useEffect(() => {
    const user = async () => {
      try {
        const response = await axiosPrivate.get("/user/me");
        console.log(response.data);
        setUserName(response.data?.user?.toUpperCase() + ",");
        return response.data;
      } catch (error) {
        console.log(error);
        window.location.href = "http://localhost:3000/Login";
      }
    };
    user();
  }, [axiosPrivate]);

  useEffect(() => {
    // Mostrar a bola após 2 segundos (pode ajustar o tempo)
    const timeout = setTimeout(() => {
      setShowBall(true);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);
  let image = "";
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosPrivate.get("/user/me");
        setUserData({
          user: response.data?.user,
          email: response.data?.email,
          profileImage: response.data?.profileImage,
        });
		image = response.data?.profileImage
      } catch (error) {
        console.log(error);
      }
    };

    fetchUserData();
  }, [axiosPrivate, setUserData]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; // Pega o primeiro arquivo selecionado
    if (file) {
      console.log("Arquivo selecionado:", file);
    } else {
      console.log("arquivo n selecionado!");
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex items-center justify-center">
      <div className="flex gap-8">
        <div className="bg-black text-white p-8 rounded-lg border border-gray-700 max-w-md">
          {/* Seção do perfil */}
          {userData && (
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold mb-4">Seu Perfil</h1>
              <div className="mb-2">
                <strong>Nome:</strong> {userData.user}
              </div>
              <div className="mb-6">
                <strong>Email:</strong> {userData.email}
              </div>
              {userData.profileImage && (
                <>
                  <img
                    src={userData.profileImage} // Aqui, o valor da imagem em base64
                    alt="Profile" // Adicione um texto alternativo para acessibilidade
                    className="w-20 h-20 rounded-full mx-auto mb-4"
                  />
                  <input
                    type="file"
                    id="file"
                    className="hidden"
                    onChange={(e) => handleFileChange(e)}
                  />
                  <label
                    htmlFor="file"
                    className="block text-white rounded-full px-4 py-2 cursor-pointer"
                  >
                    Alterar Foto
                  </label>
                </>
              )}
            </div>
          )}
        </div>
        <div className="bg-black text-white p-8 rounded-lg border border-gray-700 max-w-md">
          {/* Seção para iniciar o jogo */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              {username} SEJA BEM-VINDO AO PONG GAME
            </h1>
            <p className="mb-4">
              Desafie seus amigos em uma partida emocionante de Ping Pong!
            </p>
            <div className="flex justify-center">
              <button className="bg-blue-600 text-white rounded-full px-4 py-2 mr-4">
                Iniciar Jogo
              </button>
              <Link
                to="/profile"
                className="bg-blue-600 text-white rounded-full px-4 py-2"
              >
                Perfil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
