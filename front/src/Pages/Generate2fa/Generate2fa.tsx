import React, { useEffect, useState } from "react";
import { axiosPrivate } from "../../hooks/useAxiosPrivate";

export const CallBackQrCode = () => {
  return axiosPrivate
    .post('/authentication-2fa/generate', {
      withCredentials: true,
    })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.log(error);
      throw(error);
    });
};

const handleHomeButton = () => {
  const url =
    "http://localhost:3000/home";
  window.location.href = url;
};

export const Generate2fa = () => {
  const [qrcode, setQrCodePath] = useState();

  useEffect(() => {
    const qrcodePath = async () => {
      try {
        const response = await CallBackQrCode();
        setQrCodePath(response?.data.qrCode);
        return response?.data.qrCode;
      } catch (error) {
        console.log(error);
      }
    };

    qrcodePath();
  }, []);

  return (
    <div className="h-screen bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700 flex flex-col items-center justify-center relative">
      <div className="text-center mb-20">
        <h1 className="text-4xl font-bold">Escaneie o Qr-Code</h1>
      </div>
      <div className="mb-4">
        {qrcode && (
          <img
            src={qrcode}
            alt="QR Code"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        )}
      </div>
      <div className="mb-4">
        <button
          type="button"
          className="text-white font-bold bg-blue-600 rounded-full px-8 py-2"
          onClick={handleHomeButton}
        >
          Home
        </button>
      </div>
    </div>
  );
};
