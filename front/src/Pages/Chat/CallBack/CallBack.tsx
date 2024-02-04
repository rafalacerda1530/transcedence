import { axiosPrivate } from "../../../hooks/useAxiosPrivate";

export const CallBackAllPublicGroups = () => {
    return axiosPrivate
      .get('/api/chat/allPublicsGroups', {
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
