import axios from "axios";

export const useRefreshToken = () => {
	const refresh = async () => {
		await axios.get('http://localhost:3333/token/refresh',{
			withCredentials: true
		});
	}
	return refresh;
}
