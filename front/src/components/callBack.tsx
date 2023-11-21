import axios, { AxiosResponse } from "axios";

export const CallBackUserAndPassword = (user: any) => {
  const url = "http://localhost:3333/auth/signin";
  const data = {
    user: user.user,
    password: user.password,
    email: user.email,
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

interface Check2faResponse {
  success: string;
}

export const CallBackCheck2fa = async (user: any): Promise<boolean> => {
  try {
    const url = "http://localhost:3333/authentication-2fa/2fa/checkAtive";
    const data = {
      user: user.user,
      password: user.password,
      email: user.email,
    };

    return await axios
      .post<Check2faResponse>(url, data, {
        withCredentials: true,
      })
      .then((response: AxiosResponse<Check2faResponse>) => {
        return response.data.success === "true";
      })
      .catch((error) => {
        throw error;
      });
  }catch (error){
    throw "User cannot be Blank"
  }

}

export const CallBack2faAuthenticate = async (user: any): Promise<boolean> => {
  try {
    const url = "http://localhost:3333/authentication-2fa/2fa/authenticate";
    const data = {
      user: user.user,
      password: user.password,
      email: user.email,
      twoFactorAuthenticationCode: user.twoFactorAuthenticationCode
    };

    return await axios
      .post<Check2faResponse>(url, data, {
        withCredentials: true,
      })
      .then((response: AxiosResponse<Check2faResponse>) => {
        return response.data.success === "true";
      })
      .catch((error) => {
        throw error;
      });
  }catch (error){
    return false
  }
}
