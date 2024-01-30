// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';


<div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex flex-col items-center justify-center relative">
          <div className="text-center mb-20">
            <h1 className="text-4xl font-bold font-extrabold">
              Histórico de partidas
            </h1>
          </div>
          <div className="border border-black p-6">
            {Object.keys(history).map((key) => (
              <div key={key} className="mb-5 font-bold">
                <p >Partida: {history[key].Partida}</p>
                <p>{history[key].Pontos_Player1}</p>
                <p>{history[key].Pontos_Player2}</p>
                <p>{history[key].Vencedor}</p>
              </div>
            ))}
          </div>
        </div>