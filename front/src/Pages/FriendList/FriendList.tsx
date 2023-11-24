import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface User {
  id: number;
  email: string;
  user: string;
}

const FriendsList: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [friends, setFriends] = useState<User[]>([]);

  useEffect(() => {
    const fetchFriends = async () => {
      const response = await fetch(`http://localhost:3333/friendship/${username}`);
      const data = await response.json();
      setFriends(data);
    };

    fetchFriends();
  }, [username]);

  return (
    <div>
      <h2>Lista de Amigos</h2>
      <ul>
        {friends.map((friend) => (
          <li key={friend.id}>{friend.user}</li>
        ))}
      </ul>
    </div>
  );
};

export default FriendsList;