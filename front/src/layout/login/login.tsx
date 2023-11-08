import React, { useState, useEffect } from 'react';
import  {CallBackUserAndPassword } from '../../components/callBack';
import {CallBack }from '../../components/callBack';
import handleLoginClick from '../../components/handleCLickIntra';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';

interface UserState {
  user: string;
  senha: string;
}

function Login_game() {
  const [isActive, setActive] = useState(true);
  const [userState, setUserState] = useState<UserState>({
    user: '',
    senha: '',
  });

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

  const handleToggle = () => {
    setActive(!isActive);
  };

  const handleLogin = () => {
    CallBackUserAndPassword(userState.user, userState.senha).then((result) => {
      alert("Correto")
    }).catch((error) => {
      handleToggle();
    });
    
  }

  const handleLoginIntra = () => {
    handleLoginClick();
  };

  return (
    <>
      <div className="flex h-screen justify-center items-center flex-col bg-gradient-to-b from-purple-700 via-purple-400 to-transparent via-teal-500">
        <div className="text-center text-2xl mb-2 font-oxanium font-extrabold flex flex-col gap-20">
          <h1 className="flex justify-center items-center">PONG GAME</h1>
          <div className="flex flex-col gap-8 items-center justify-center">
            <input
              type="text"
              placeholder="User"
              className="rounded-lg p-2 px-14"
              value={userState.user}
              onChange={handleUserChange}
            />
            <div className={
                isActive
                  ? " visibility: hidden"
                  : " text-red-500"
              }>
              Incorret password or user
            </div>
            <input
              type="password"
              placeholder="Senha"
              className="rounded-lg p-2 px-14"
              value={userState.senha}
              onChange={handleSenhaChange}
            />
            <h1 className="flex space-x-10">
              <button
                className="text-black rounded-lg"
                //onClick={handleLogin} //criar tela de registro
              >
                Register
              </button>
              <h2 className="flex items-center">
             <button
                className="text-black rounded-lg"
                onClick={handleLoginIntra}
                
              >
                Login Intra_
                
              </button>
              <img src="./favicon.ico" className="w-8 h-8 mr-2 "/>
              <Router><CallBack/></Router>
             </h2>
             </h1>
          </div>
          <div className="flex flex-col items-center justify-center">
            <button
              className="p-2 px-14 bg-black text-white rounded-lg"
              onClick={handleLogin}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login_game;
