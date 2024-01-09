import axios from "axios";
import { useEffect } from "react";
import { useRefreshToken } from "./useRefreshToken";


export const axiosPrivate = axios.create({
	baseURL: process.env.REACT_APP_API_URL,
	withCredentials: true
})

export const useAxiosPrivate = () => {
	const refresh = useRefreshToken();

	useEffect(() => {
		const responseIntercept = axiosPrivate.interceptors.response.use(
			response => response,
			async (error) => {
				const prevRequest = error?.config;
				console.log(error?.response?.status);
				if (error?.response?.status === 401 && !prevRequest?.sent){
					const newRequest = { ...prevRequest };
					newRequest.sent = true;
					await refresh();
					return axiosPrivate(newRequest);
				}
				return Promise.reject(error);
			}
		)

		return () => {
			axiosPrivate.interceptors.response.eject(responseIntercept);
		}
	}, [refresh])

	return axiosPrivate;
}
