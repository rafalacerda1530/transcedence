import axios from "axios";

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
