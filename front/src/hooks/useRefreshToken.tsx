import axios from "axios";

export const useRefreshToken = () => {
	const refresh = async () => {
	  try {
		await axios.get('http://localhost:3333/token/refresh', {
		  withCredentials: true
		});
	  } catch (error) {
		console.error('Error refreshing token:', error);
		throw error;
	  }
	}
	return refresh;
   }
