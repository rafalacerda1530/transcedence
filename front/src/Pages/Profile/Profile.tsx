import React, { useEffect, useState } from "react";
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate";

const Profile = () => {
  interface UserData {
    user: string;
    email: string;
    profileImage: string;
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const axiosPrivate = useAxiosPrivate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosPrivate.get("/user/me");
        setUserData({
          user: response.data?.user,
          email: response.data?.email,
          profileImage: response.data?.profileImage,
        });
      } catch (error) {
        console.log(error);
      }
    };

    fetchUserData();
  }, [axiosPrivate, setUserData]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; // Pega o primeiro arquivo selecionado
    if (file) {
      console.log("Arquivo selecionado:", file);
    } else {
      console.log("arquivo n selecionado!");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700">
      <div className="bg-black text-white p-8 rounded-lg border border-gray-700 w-96">
        <h1 className="text-4xl font-bold text-center mb-4">Seu Perfil</h1>
		{userData && (
            <div className="text-center mb-6"> 
              <div className="mb-2">
                <strong>Nome:</strong> {userData.user}
              </div>
              <div className="mb-6">
                <strong>Email:</strong> {userData.email}
              </div> 
                  <img
                    src={userData.profileImage != null ? userData.profileImage : "https://i.imgur.com/VavB8Rm.png" } 
                    alt="Profile"  
                    className="w-20 h-20 rounded-full mx-auto mb-4"
                  />
                  <input
                    type="file"
                    id="file"
                    className="hidden"
                    onChange={(e) => handleFileChange(e)}
                  />
                  <label
                    htmlFor="file"
                    className="block text-white rounded-full px-4 py-2 cursor-pointer"
                  >
                    Alterar Foto
                  </label>
                 
            </div>
          )}
      </div>
    </div>
  );
};

export default Profile;
