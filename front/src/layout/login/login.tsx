import React, { useState } from 'react';
import { CallBackUserAndPassword } from '../../components/callBack';
import handleLoginClick from '../../components/handleCLickIntra';
import { BrowserRouter as Router } from 'react-router-dom';
import "./loginGame.css"

interface UserState {
  user: string;
  senha: string;
}

function LoginGame() {
  const [userState, setUserState] = useState<UserState>({
    user: '',
    senha: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleUserChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserState({
      ...userState,
      user: event.target.value,
    });
  };

  const handleSenhaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserState({
      ...userState,
      senha: event.target.value,
    });
  };

  const handleLogin = () => {
    CallBackUserAndPassword(userState.user, userState.senha)
      .then(() => {
        alert('Login bem-sucedido');
      })
      .catch(() => {
        setErrorMessage('Senha ou usuário incorretos');
      });
  };

  const handleLoginIntra = () => {
    handleLoginClick();
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-purple-800 to-blue-800">
      <div className="w-full max-w-md p-6 rounded-xl bg-white text-black shadow-2xl">
        <h1 className="text-4xl font-extrabold text-center mb-6 text-purple-600">
          PONG - GAME
        </h1>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Usuário"
            className="w-full px-4 py-3 bg-gray-200 border rounded-full text-black focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={userState.user}
            onChange={handleUserChange}
          />
        </div>
        {errorMessage && (
          <div className="text-red-500 mb-6 text-center">{errorMessage}</div>
        )}
        <div className="mb-6">
          <input
            type="password"
            placeholder="Senha"
            className="w-full px-4 py-3 bg-gray-200 border rounded-full text-black focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={userState.senha}
            onChange={handleSenhaChange}
          />
        </div>
        <div className="flex justify-between">
          <button
            className="w-1/2 py-3 rounded-full bg-purple-600 text-white hover:bg-purple-700"
          >
            Registrar
          </button>
          <button
            className="w-1/2 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleLoginIntra}
          >
            Login Intra
          </button>
        </div>
        <Router>
          {/* <CallBack /> */}
        </Router>
        <div className="text-center mt-6">
          <button
            className="py-3 w-full rounded-full bg-purple-600 text-white hover:bg-purple-700"
            onClick={handleLogin}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}



export default LoginGame;
