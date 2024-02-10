import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

export const CallBack = () => {
  const queryParams = useMemo(() => {
    return new URLSearchParams(window.location.search);
  }, []);
  const [code, setCode] = useState("");

  useEffect(() => {
    const error = queryParams.get("error");
    if (error === "access_denied") {
        console.log(error);
        // Redirecione para a tela de login
        window.location.href = "http://localhost:3000/Login";
    }
    const newCode = queryParams.get("code");
    if (newCode)
        setCode(newCode);
  }, [queryParams]);

  useEffect(() => {
    if (code){
        const url = process.env.REACT_APP_API_URL + "/oauth/intra/" + code;
        axios
          .get(url, {
            withCredentials: true,
          })
          .then((response) => {
        window.location.href = "http://localhost:3000/Home";
          })
      .catch((error) => {
        console.error("Erro na requisição:", error);
        window.location.href = "http://localhost:3000/Login";
          });
    }
  }, [code]);

  return (
    <>
      <div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex items-center justify-center relative">
              <div className="absolute top-0 left-0 right-0 w-32 h-32 mx-auto mt-52 mb-0 bg-white rounded-full animate-bounce ">
            {/*bola de ping pong */}
              </div>
              <h1 className="text-4xl font-bold text-center text-white mb-4">
                WAITING VALIDATION
              </h1>
      </div>
    </>
  );
}
