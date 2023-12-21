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

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-b from-purple-700 via-purple-400 to-purple-700">
      <div className="bg-black text-white p-8 rounded-lg border border-gray-700 w-96">
        <h1 className="text-4xl font-bold text-center mb-4">Seu Perfil</h1>
        {userData && (
          <div className="text-center">
            <p className="mb-2">
              <strong>Nome:</strong> {userData.user}
            </p>
            <p className="mb-6">
              <strong>Email:</strong> {userData.email}
            </p>
            {userData.profileImage && (
              <img
                src="https://i.imgur.com/VavB8Rm.png"
                alt="Foto do perfil"
                className="w-32 h-32 rounded-full mx-auto mb-4"
                style={{ backgroundColor: "transparent" }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
