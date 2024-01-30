import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { axiosPrivate } from "../../hooks/useAxiosPrivate";

interface MatchHistoryItem {
  Partida: string;
  Pontos_Player1: string;
  Pontos_Player2: string;
  Vencedor: string;
}

const handleHomeButton = () => {
  const url =
    "http://localhost:3000/home";
  window.location.href = url;
};

export const CallBackMatchHistory = (userId?: string) => {
  // Adicione userId aos parâmetros de consulta
  return axiosPrivate
    .get('user/getUserHistoryComplete', {
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

export const MatchHistoryComplete =  () => {
    const { user } = useParams<{ user: string }>();
    const [history, setHistory] = useState<Record<string, MatchHistoryItem>>({});
    const [showBall, setShowBall] = useState(true);
    
    useEffect(() => {
      const AllHistory = async () => {
        try { 
            const response = await CallBackMatchHistory(user);
            const batata = response.data.history[0]['Vencedor']
            setHistory(response.data.history);
        } catch (error) {
          console.log(error);
        }
      };

      AllHistory();
    }, []);

    return (
      <>
        <div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex flex-col items-center justify-center relative">
          {showBall && (
            <div className="absolute top-0 left-0 right-0 w-16 h-16 mx-auto mt-8 bg-white rounded-full animate-bounce">
            {/*bola de ping pong */}
            </div>
          )}
          <div className="text-center mb-20">
          </div>
          
          <div className="bg-black bg-opacity-70 text-white p-8 rounded-lg border border-gray-700 max-w-md">
              <div className="text-center mb-6">
                <h1 className= "text-blue-500 text text-4xl font-bold mb-4">
                  Histórico de partidas
                </h1>
                <div className="mb-4 flex flex-col items-center justify-center">
                {Object.keys(history).map((key) => (
                    <div key={key} className="mb-5 font-bold">
                    <p >Partida: {history[key].Partida}</p>
                    <p>{history[key].Pontos_Player1}</p>
                    <p>{history[key].Pontos_Player2}</p>
                    <p>{history[key].Vencedor}</p>
                    </div>
                    ))}
                  <div className="flex flex-col items-center">
                    <button
                    type="button"
                    className="text-white font-bold bg-blue-600 text-white rounded-full px-8 py-2"
                    onClick={handleHomeButton}
                    >
                      Home
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </>
    );
    
    
}
