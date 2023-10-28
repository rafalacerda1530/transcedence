import { useLocation } from 'react-router-dom';
import React from "react";
import axios, { AxiosResponse, AxiosError } from 'axios';

function CallBack(){
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const url = 'http://localhost:4000/token/'+code 

    axios.get(url).then((response: AxiosResponse) => {
        console.log('Resposta do servidor:', response.data);
      })
      .catch((error: AxiosError) => {
        console.error('Erro na requisição:', error);
      })

    return(
        <div>Call back
        <p>URL atual: {url}</p>
        </div>
    )
}

export default CallBack