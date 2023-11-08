import { useLocation } from 'react-router-dom';
import React, { useEffect } from "react";
import axios, { AxiosResponse, AxiosError } from 'axios';


export function CallBack() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const url = 'http://localhost:4000/token/' + code;

  // Realize a chamada ao servidor aqui, de forma assíncrona
  useEffect(() => {
    axios
      .get(url)
      .then((response) => {
        console.log('Resposta do servidor:', response.data);
      })
      .catch((error) => {
        console.error('Erro na requisição:', error);
      });
  }, [url]);

  return null;
}

export const CallBackUserAndPassword = (user: String, password : String) => {
  const url = 'http://localhost:4000/auth/signin';
  const data = {
    user: user,
    password: password,
  };

  return axios
    .post(url, data)
    .then((response) => {
      console.log("True");
      return "true";
    })
    .catch((error) => {
      console.log("False", error);
      throw error; 
    });
};
