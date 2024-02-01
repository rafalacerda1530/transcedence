import axios from "axios";

export const useRefreshToken = () => {
	const refresh = async () => {
	  try {
		await axios.get(process.env.REACT_APP_API_URL + '/token/refresh', {
		  withCredentials: true
		});
	  } catch (error) {
		console.error('Error refreshing token:', error);
		throw error;
	  }
	}
	return refresh;
   }
