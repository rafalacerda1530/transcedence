import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { axiosPrivate } from "../../hooks/useAxiosPrivate";

export const CallBackQrCode = (user: any) => {
  const url = "http://localhost:3333/authentication-2fa/generate/";
  const data = {
    user: user.user,
  };
  return axios
    .post(url, data, {
      withCredentials: true,
    })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      throw error;
    });
};

export const Generate2fa =  () => {
    const [username, setUserName] = useState();
    const [qrcode, setQrCodePath] = useState();

    useEffect(() => {
      const user = async () => {
        try {
          const response = await axiosPrivate.get('/user/me');
          console.log(response.data);
          setUserName(response.data?.user?.toUpperCase());
          return response.data;
        } catch (error) {
          console.log(error);
          window.location.href = "http://localhost:3000/login";
        }
      };
    
      user();
    }, []); 
    
    useEffect(() => {
      const qrcodePath = async () => {
        try {
          const userResponse = await axiosPrivate.get('/user/me');
          const response = await CallBackQrCode(userResponse.data);
          setQrCodePath(response.data.qrCode);
          return response.data.qrCode;
        } catch (error) {
          console.log(error);
        }
      };
    
      qrcodePath();
    }, []); 
    
    return(
        <>
          <div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex flex-col items-center justify-center relative">
            <div className="text-center mb-20">
              <h1 className="text-4xl font-bold">
                Escaneie o Qr-Code
              </h1>
            </div>
            <div >
              {qrcode && (
                <img
                  src={qrcode}
                  alt="QR Code"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )}
            </div>
          </div>
        </>
      );
}
