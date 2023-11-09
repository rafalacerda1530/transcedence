import axios from 'axios';

export const CallBackUserAndPassword = (user: String, password : String) => {
  const url = 'http://localhost:3333/auth/signin';
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
