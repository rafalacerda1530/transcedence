import React, { useEffect, useState } from "react";

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
            <div className="absolute top-0 left-0 right-0 w-32 h-32 mx-auto mt-40 bg-white rounded-full animate-bounce">
              {/*bola de ping pong */}
            </div>
          )}
          <div className="bg-black text-white p-8 rounded-lg border border-gray-700">
            <h1 className="text-4xl font-bold text-center mb-4">SEJA BEM VINDO</h1>
          </div>
        </div>
      </>
    );
};
