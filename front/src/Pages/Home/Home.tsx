import React, { useEffect, useState } from "react";
import pingPongBall from "./pingPongBall.png"; // Importe uma imagem de uma bola de ping pong

export const Home = () => {
  const [showBall, setShowBall] = useState(false);

  useEffect(() => {
    // Mostrar a bola após 2 segundos (pode ajustar o tempo)
    const timeout = setTimeout(() => {
      setShowBall(true);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex items-center justify-center relative">
        {showBall && (
          <div className="absolute top-0 left-0 right-0 w-16 h-16 mx-auto mt-32 bg-white rounded-full animate-bounce">
            {/*bola de ping pong */}
          </div>
        )}
        <div className="bg-black text-white p-8 rounded-lg border border-gray-700">
          <h1 className="text-4xl font-bold text-center mb-4">
            SEJA BEM-VINDO AO PONG GAME
          </h1>
          <p className="text-center">
            Desafie seus amigos em uma partida emocionante de Ping Pong!
          </p>
          <div className="flex justify-center mt-6">
            <button className="bg-blue-600 text-white rounded-full px-4 py-2">
              Iniciar Jogo
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
