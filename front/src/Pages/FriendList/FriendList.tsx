import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface User {
    id: number;
    user: string;
    status: string;
}

const FriendsList: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const [friends, setFriends] = useState<User[]>([]);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await fetch(process.env.REACT_APP_API_URL + `/friendship/${username}`);
                const data = await response.json();
                setFriends(data);
            } catch (error) {
                console.error('Error fetching friends:', error);
            }
        };

        fetchFriends();
    }, [username]);

    return (
        <div>
            <h2>Lista de Amigos</h2>
            <ul>
                {friends.map((friend) => (
                    <li key={friend.id}>
                        {friend.user} - {friend.status}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FriendsList;
