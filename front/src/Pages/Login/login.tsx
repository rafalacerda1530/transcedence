import React, { useState, useEffect } from "react";
import {
  CallBack2faAuthenticate,
  CallBackCheck2fa,
  CallBackUserAndPassword,
} from "../../components/callBack";
import axios from "axios";

const defaultPhoto = "https://i.imgur.com/VavB8Rm.png";

function LoginGame() {
  const [formData, setFormData] = useState({
    user: "",
    password: "",
    email: "",
    twoFactorAuthenticationCode: "",
    profileImage: defaultPhoto, // Inclua a URL padrão aqui
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [showBall, setShowBall] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authenticate2factor, setAuthenticate2faActive] = useState(false);

  const handleInputChange = (event: { target: { name: any; value: any } }) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleLogin = async (event: { preventDefault: () => void }) => {
    event.preventDefault(); // Evite o envio do formulário padrão
    const authentication2fa = await CallBackCheck2fa(formData);
    if (authentication2fa && authenticate2factor === false)
      setAuthenticate2faActive(true);
    else if (!formData.user || !formData.password) {
      setErrorMessage("Campos não podem estar vazios");
    } else {
      if (
        authentication2fa === true &&
        (await CallBack2faAuthenticate(formData)) === false
      ) {
        setErrorMessage("Código Inválido");
      } else {
        CallBackUserAndPassword(formData)
          .then((response) => {
            console.log(response.data);
            window.location.href = "http://localhost:3000/Home";
          })
          .catch((error) => {
            console.log("erro:", error.response.data.message);
            setErrorMessage(error.response.data.message);
          });
      }
    }
  };

  const handleLoginIntra = () => {
    const url =
      "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-e4c7b8cd4fb31c268132af823110ef8bdbf90e2df97baf4c1fe0f4a6f93e110b&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2FcallBack&response_type=code";

    window.location.href = url;
  };
  const validatePassword = (senha: string): boolean => {
    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const numberRegex = /[0-9]/;
    const specialCharRegex = /[!?@#$%^&*()-+_]/; // Adicione outros caracteres especiais conforme necessário

    const hasUppercase = uppercaseRegex.test(senha);
    const hasLowercase = lowercaseRegex.test(senha);
    const hasNumber = numberRegex.test(senha);
    const hasSpecialChar = specialCharRegex.test(senha);

    const isValid =
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSpecialChar &&
      senha.length >= 8; // Mínimo de 8 caracteres

    return isValid;
  };

  const handleRegister = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    // const data = {
    // 	user: "julia",
    // 	password: "1234",
    // 	email: "julia@julia.com",
    //   };
    if (validatePassword(formData.password)) {
      //console.log("Senha válida! Pode ser enviada para a API.");
      axios
        .post(process.env.REACT_APP_API_URL + "/auth/signup", formData, {
          withCredentials: true,
        })
        .then((response) => {
          window.location.href = "http://localhost:3000/Home";
        })
        .catch((error) => {
          console.log("erro:", error.response.data.message, formData);
          setErrorMessage(error.response.data.message);
        });
    } else {
      setErrorMessage("A senha não atende aos critérios.");
    }
  };

  useEffect(() => {
    console.log(process.env.REACT_APP_API_URL);
    // Mostrar a bola após 2 segundos (pode ajustar o tempo)
    const timeout = setTimeout(() => {
      setShowBall(true);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex items-center justify-center relative">
      {showBall && (
        <div className="absolute top-0 left-0 right-0 w-16 h-16 mx-auto mt-8 bg-white rounded-full animate-bounce">
          {/*bola de ping pong */}
        </div>
      )}
      <div className="bg-black text-white p-8 rounded-lg border border-gray-700 w-96">
        <h1 className="text-4xl font-bold text-center mb-4">PONG GAME</h1>
        {isRegistering ? (
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <input
                type="text"
                name="email"
                placeholder="Email"
                className="w-full px-3 py-2 rounded-full bg-gray-700 text-white placeholder-white"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-4">
              <input
                type="text"
                name="user"
                placeholder="Usuário"
                className="w-full px-3 py-2 rounded-full bg-gray-700 text-white placeholder-white"
                value={formData.user}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-4">
              <input
                type="password"
                name="password"
                placeholder="password"
                className="w-full px-3 py-2 rounded-full bg-gray-700 text-white placeholder-white"
                value={formData.password}
                onChange={(event) => {
                  setErrorMessage(""); // Limpa a mensagem de erro
                  handleInputChange(event); // Chama a função handleInputChange original
                }}
              />{" "}
              <p className="text-xs text-gray-400 mb-1 mt-1">
                A senha deve conter pelo menos 8 caracteres, incluindo pelo
                menos uma letra maiúscula, uma letra minúscula, um número e um
                caractere especial.
              </p>
              {errorMessage && (
                <p className="text-red-500 text-center mt-2">{errorMessage}</p>
              )}
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-blue-600 text-white rounded-full px-4 py-2 mr-2"
              >
                Registrar
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white rounded-full px-4 py-2"
                onClick={() => setIsRegistering(false)}
              >
                Voltar para Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <input
                type="text"
                name="user"
                placeholder="Usuário"
                className="w-full px-3 py-2 rounded-full bg-gray-700 text-white placeholder-white"
                value={formData.user}
                onChange={(event) => {
                  setErrorMessage(""); // Limpa a mensagem de erro
                  handleInputChange(event); // Chama a função handleInputChange original
                }}
              />
            </div>
            {authenticate2factor && (
              <div className="mb-4">
                <input
                  type="text"
                  name="twoFactorAuthenticationCode"
                  placeholder="Authenticator CODE"
                  className="w-full px-3 py-2 rounded-full bg-gray-700 text-white placeholder-white"
                  onChange={(event) => {
                    setErrorMessage(""); // Limpa a mensagem de erro
                    handleInputChange(event); // Chama a função handleInputChange original
                  }}
                />
              </div>
            )}
            <div className="mb-4">
              <input
                type="password"
                name="password"
                placeholder="password"
                className="w-full px-3 py-2 rounded-full bg-gray-700 text-white placeholder-white"
                value={formData.password}
                onChange={(event) => {
                  setErrorMessage(""); // Limpa a mensagem de erro
                  handleInputChange(event); // Chama a função handleInputChange original
                }}
              />
              {errorMessage && (
                <p className="text-red-500 text-center mt-2">{errorMessage}</p>
              )}
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-blue-600 text-white rounded-full px-4 py-2 mr-2"
              >
                Login
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white rounded-full px-4 py-2"
                onClick={handleLoginIntra}
              >
                Login Intra
              </button>
            </div>
            <p className="text-center text-sm mt-4">
              <button type="button" onClick={() => setIsRegistering(true)}>
                Registrar
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginGame;
