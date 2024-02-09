import { axiosPrivate } from "../../../hooks/useAxiosPrivate";

export const CallBackAllGroups = () => {
    return axiosPrivate
        .get('/api/chat/allGroups', {
            withCredentials: true,
        })
        .then((response) => {
            return response;
        })
        .catch((error) => {
            console.log(error);
            throw (error);
        });
};

export const CallBackAllDmGroups = async (username: string) => {
    try {
        const response = await axiosPrivate.get(`/api/chat/allDm/${username}`, {
            withCredentials: true,
        });
        return response;
    } catch (error) {
        console.error(error);
        throw error;
    }
};
