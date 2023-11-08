import React, { useState, useEffect } from "react";
import { CallBackUserAndPassword } from "../../components/callBack";
import handleLoginClick from "../../components/handleCLickIntra";
import { BrowserRouter as Router } from "react-router-dom";

function LoginGame() {

  const [userState, setUserState] = useState({
    user: "",
    senha: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [showBall, setShowBall] = useState(false);

  const handleUserChange = (event: { target: { value: any } }) => {
    setUserState({
      ...userState,
      user: event.target.value,
    });
  };

  const handleSenhaChange = (event: { target: { value: any } }) => {
    setUserState({
      ...userState,
      senha: event.target.value,
    });
  };

  const handleLogin = () => {
    CallBackUserAndPassword(userState.user, userState.senha)
      .then(() => {
        alert("Login bem-sucedido");
      })
      .catch(() => {
        setErrorMessage("Senha ou usuário incorretos");
      });
  };

  const handleLoginIntra = () => {
    const url =
      "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-e4c7b8cd4fb31c268132af823110ef8bdbf90e2df97baf4c1fe0f4a6f93e110b&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2FcallBack&response_type=code";

    window.location.href = url;
    console.log("teste da url: ", url);
  };

  useEffect(() => {
    // Mostrar a bola após 2 segundos (pode ajustar o tempo)
    const timeout = setTimeout(() => {
      setShowBall(true);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex items-center justify-center relative">
      {showBall && (
        <div className="absolute top-0 left-0 right-0 w-16 h-16 mx-auto mt-16 bg-white rounded-full animate-bounce">
          {/*bola de ping pong */}
        </div>
      )}
      <div className="bg-black text-white p-8 rounded-lg border border-gray-700">
        <h1 className="text-4xl font-bold text-center mb-4">PONG GAME</h1>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Usuário"
            className="w-full px-3 py-2 rounded-full bg-gray-700 text-white placeholder-white"
            value={userState.user}
            onChange={handleUserChange}
          />
        </div>
        <div className="mb-4">
          <input
            type="password"
            placeholder="Senha"
            className="w-full px-3 py-2 rounded-full bg-gray-700 text-white placeholder-white"
            value={userState.senha}
            onChange={handleSenhaChange}
          />
          {errorMessage && (
            <p className="text-red-500 text-center mt-2">{errorMessage}</p>
          )}
        </div>
        <div className="flex justify-center">
          <button
            className="bg-blue-600 text-white rounded-full px-4 py-2 mr-2"
            onClick={handleLogin}
          >
            Login
          </button>
          <button
            className="bg-blue-600 text-white rounded-full px-4 py-2"
            onClick={handleLoginIntra}
          >
            Login Intra
          </button>
        </div>
        <p className="text-center text-sm mt-4">
          <a className="text-blue-400" href="#">
            Registrar
          </a>
        </p>
      </div>
    </div>
  );
}

export default LoginGame;
