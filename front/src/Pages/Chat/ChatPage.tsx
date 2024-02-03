import React, { useContext, useEffect, useState } from 'react';
import './style.css'
import { ChatContext } from '../../context/ChatContext';
import { useRefreshToken } from "../../hooks/useRefreshToken";
import { axiosPrivate } from '../../hooks/useAxiosPrivate';

interface Group {
    name: string;
    type: string;
}

export const ChatPage = () => {
    const chatSocket = useContext(ChatContext);
    const refreshToken = useRefreshToken();
    const [groupsAndDms, setGroupAndDms] = useState<Group[]>([]);
    const [currentChat, setCurrentChat] = useState<string | null>(null);
    const [members, setMembers] = useState<string[]>([]);
    const [message, setMessage] = useState<string>('');
    const [newGroupName, setNewGroupName] = useState<string>('');
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string | null>(null);
    const [maxHeight, setMaxHeight] = useState<number>(0);
    const [groupType, setGroupType] = useState<string>('PUBLIC'); // Inicializado como "PUBLIC"
    const [selectedGroupType, setSelectedGroupType] = useState<string>(''); // Inicializado como "PUBLIC"



    const connectSocket = () => {
        chatSocket.connect();
        chatSocket.on("connect", () => {
            console.log("----------Conectado ao socket");
        });

        chatSocket.on("GroupsAndDms", (body) => {
            setGroupAndDms(body);
        })

        chatSocket.on("jwt_error", async (error) => {
            console.log(`Connection failed due to ${error.message}`);
            console.log("Tentando Reautenticar");
            disconnectSocket();
            try {
                await refreshToken();
            } catch (error) {
                console.log(error);
                window.location.href = "http://localhost:3000/login";
            }
            connectSocket();
        });

        chatSocket.on("missing_token", async () => {
            disconnectSocket();
            try {
                await refreshToken();
            } catch (error) {
                console.log(error);
                window.location.href = "http://localhost:3000/login";
            }
            connectSocket();
        });

    };

    const disconnectSocket = () => {
        chatSocket.off("connect");
        chatSocket.off("jwt_error");
        chatSocket.off("missing_cookie");
        chatSocket.disconnect();
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axiosPrivate.get("/user/me");
                setUsername(response.data.user);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        connectSocket();
        return () => {
            console.log("Desconectando do socket");
            disconnectSocket();
        };
    }, [chatSocket]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(event.target.value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Lógica para enviar a mensagem
        console.log('Message:', message);
        // Limpar o campo de mensagem após o envio
        setMessage('');
    };

    const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const response = await axiosPrivate.post('/api/chat/createGroup', {
                type: groupType,
                groupName: newGroupName,
                ownerUsername: username,
                password: groupType == "PROTECT" ? password : null
            });
            console.log(response)
            console.log('Group created:', response.data);
            // Adicionar o novo grupo à lista de grupos
            setGroupAndDms([...groupsAndDms, { name: newGroupName, type: groupType }]);
            // Limpar o campo de nome do grupo
            setNewGroupName('');
            setPassword('')
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    const calculateMaxHeight = () => {
        const windowHeight = window.innerHeight;
        // Defina uma margem superior e inferior para garantir que haja espaço suficiente
        const margin = 100;
        const calculatedMaxHeight = windowHeight - margin;
        setMaxHeight(calculatedMaxHeight);
    };
    useEffect(() => {
        calculateMaxHeight();
        window.addEventListener('resize', calculateMaxHeight);
        return () => {
            window.removeEventListener('resize', calculateMaxHeight);
        };
    }, []);

    useEffect(() => {
        const getMembersInGroup = async () => {
            try {
                if (currentChat) {
                    console.log(selectedGroupType)
                    const response = await axiosPrivate.post('/api/chat/membersInChat', {
                        groupName: currentChat,
                        type: selectedGroupType
                    });
                    setMembers(response.data);
                } else {
                    setMembers([]);
                }
            } catch (error) {
                console.error('Error fetching group members:', error);
            }
        };

        getMembersInGroup();
    }, [currentChat, groupType]);

    // Nova função para atualizar groupType ao selecionar um novo grupo
    useEffect(() => {
        const getGroupType = async () => {
            const selectedGroup = groupsAndDms.find(group => group.name === currentChat);
            if (selectedGroup) {
                setSelectedGroupType(selectedGroup.type);
            }
        };

        getGroupType();
    }, [currentChat, groupsAndDms]);

    return (
        <div className="chatPageContainer">
            <div className="groupDmsContainer" style={{ maxHeight: `${maxHeight}px` }}>
                <h1>Groups and DMs</h1>
                <form className="createGroupForm" onSubmit={handleCreateGroup}>
                    <select value={groupType} onChange={(e) => setGroupType(e.target.value)} className="groupTypeSelect" >
                        <option value="PUBLIC">Public</option>
                        <option value="PROTECT">Protected</option>
                        <option value="PRIVATE">Private</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Enter group name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="groupNameInput"
                    />
                    {/* Renderizar campo de senha somente se o tipo de grupo for "Private" */}
                    {groupType === "PROTECT" && (
                        <input
                            type="password"
                            placeholder="Enter group password"
                            value={password || ''}
                            onChange={(e) => setPassword(e.target.value)}
                            className="groupPasswordInput"
                        />
                    )}
                    <button type="submit" className="createGroupButton">Create</button>
                </form>
                <ul>
                    {groupsAndDms.map((group, index) => (
                        <li key={index} onClick={() => {
                            setCurrentChat(group.name);
                            setSelectedGroupType(group.type);
                        }}>
                            {group.name}
                            <span className="groupTypeIndicator">({group.type})</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="chatContainer">
                <h1>{currentChat ? `Chat with ${currentChat}` : 'Select a chat'}</h1>
                {/* Renderizar o conteúdo do chat aqui */}
            </div>
            {currentChat && (
                <div className="membersContainer">
                    <h1>Members</h1>
                    <ul>
                        {members.map((member, index) => (
                            <li key={index}>{member}</li>
                        ))}
                    </ul>
                </div>
            )}
            {currentChat && (
                <div className="messageInputContainer">
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={message}
                            onChange={handleChange}
                            placeholder="Type your message (max 200 characters)"
                            maxLength={200}
                        />
                        <button type="submit">Send</button>
                    </form>
                </div>
            )}
        </div>
    )
};
