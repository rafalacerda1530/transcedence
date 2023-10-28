import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios, { AxiosResponse, AxiosError } from 'axios';

function CallBack() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [code, setCode] = useState('');;

  useEffect(() => {
      const newCode = params.get('code');
      if (newCode)
        setCode(newCode);
  }, []);

  const url = 'http://localhost:4000/token/' + code;
  useEffect(() => {
    if (code){
      axios.get(url)
        .then((response: AxiosResponse) => {
          console.log('Server response:', response.data);
        })
        .catch((error: AxiosError) => {
          console.error('Request error:', error);
        });
    }
  }, [code]);

  return (
    <div>
      Call back
      <p>URL: {url}</p>
    </div>
  );
}

export default CallBack;
