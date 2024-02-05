import { axiosPrivate } from "../../../hooks/useAxiosPrivate";

export const CallBackAllGroups  = () => {
    return axiosPrivate
      .get('/api/chat/allGroups', {
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
