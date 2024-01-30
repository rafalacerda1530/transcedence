import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../../../hooks/useAxiosPrivate';
import './ToggleSwitch.css';

export const CallBackValidate2faActive = async () => {
  try {
    const response = await axiosPrivate.post('/authentication-2fa/2fa/checkIfAtive', {
      withCredentials: true,
    });
    return response.data.success;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const CallBackActive2fa = async () => {
  try {
    const response = await axiosPrivate.post('/authentication-2fa/2fa/activate', {
      withCredentials: true,
    });
    return response.data.success;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const CallBackDesactive2fa = async () => {
  try {
    const response = await axiosPrivate.post('/authentication-2fa/2fa/desactivate', {
      withCredentials: true,
    });
    return response.data.success;
  } catch (error) {
    console.log(error);
    throw error;
  }
};


const ToggleSwitch = () => {
  const [ativo, setAtivo] = useState(false)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const success = await CallBackValidate2faActive();
        if (success === true) {
          setAtivo(true);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []); 

  const handleToggle = () => {
    setAtivo(!ativo);
    try {
      if (ativo === false){
        CallBackActive2fa()
      }
      else{
        CallBackDesactive2fa()
      }
    } catch (error) {
      alert("Erro ao localizar")
    }
    
  };

  return (
    <div className={`toggle-switch ${ativo ? 'ativo' : 'inativo'}`} onClick={handleToggle}>
      <div className="switch"></div>
    </div>
  );
};

export default ToggleSwitch;
