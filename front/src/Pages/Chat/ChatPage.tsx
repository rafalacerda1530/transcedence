import React, { useContext, useEffect, useState } from 'react';
import './style.css'
import { ChatContext } from '../../context/ChatContext';
import { useRefreshToken } from "../../hooks/useRefreshToken";
import { axiosPrivate } from '../../hooks/useAxiosPrivate';
import { CallBackAllPublicGroups } from './CallBack/CallBack';

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
    const [chatMessages, setChatMessages] = useState<{ [groupName: string]: string[] }>({});
    const [selectedGroupTypeFilter, setSelectedGroupTypeFilter] = useState<string>(''); // Estado para armazenar a seleção do filtro
    const [isMember, setIsMember] = useState<boolean>(false);

    const handleChangeMessage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(event.target.value);
    };

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

        if (currentChat) {
            const newMessage = `${username}: ${message}`;

            chatSocket.emit("sendMessage", {
                groupName: currentChat,
                message: newMessage
            });

            const updatedMessages = {
                ...chatMessages,
                [currentChat]: [...(chatMessages[currentChat] || []), newMessage],
            };

            setChatMessages(updatedMessages);
            setMessage('');
        }
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

    

    useEffect(() => {
        // Adicionar um manipulador de eventos para lidar com mensagens recebidas
        chatSocket.on("receiveMessage", (data) => {
            const { groupName, message } = data;

            // Atualizar localmente o estado das mensagens
            const updatedMessages = {
                ...chatMessages,
                [groupName]: [...(chatMessages[groupName] || []), message],
            };

            setChatMessages(updatedMessages);
        });

        // ... (restante do código)

        return () => {
            // Remover o manipulador de eventos ao desmontar o componente
            chatSocket.off("receiveMessage");
        };
    }, [chatSocket, chatMessages]);

    useEffect(() => {
        const getMembersInGroup = async () => {
            try {
                if (currentChat) {
                    console.log(selectedGroupType);
                    const response = await axiosPrivate.post('/api/chat/membersInChat', {
                        groupName: currentChat,
                        type: selectedGroupType,
                    });
                    setMembers(response.data);
                    setIsMember(response.data.includes(username));
                } else {
                    setMembers([]);
                    setIsMember(false);
                }
            } catch (error) {
                console.error('Error fetching group members:', error);
            }
        };

        getMembersInGroup();
    }, [currentChat, groupType, username]);

    const handleJoinGroup = async () => {
        
        try {
            if (currentChat) {
            await axiosPrivate.post('/api/chat/joinGroup', {
                groupName: currentChat,
                username: username
            });}

            // Atualize o estado para refletir que o usuário agora é um membro do grupo
            setIsMember(true);
        } catch (error) {
            alert(error)
            alert("erro")
            console.error('Error joining group:', error);
        }
    };

    useEffect(() => {
        // Função assíncrona para chamar a API e definir os grupos iniciais
        const fetchInitialGroups = async () => {
            try {
                const response = await CallBackAllPublicGroups();
                setGroupAndDms(response.data); // ou ajuste de acordo com a estrutura da resposta
            } catch (error) {
                console.error('Error fetching initial groups:', error);
            }
        };

        // Chamada da função para buscar os grupos ao montar o componente
        fetchInitialGroups();
    }, []); // Array vazio para garantir que seja chamado apenas uma vez ao montar o componente
    
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
                    {groupType === "PROTECT" && (
                        <input
                            type="password"
                            placeholder="Enter group password"
                            value={password || ''}
                            onChange={(e) => setPassword(e.target.value)}
                            className="groupPasswordInput"
                        />
                    )}
                    <button type="submit" className="createGroupButton" onClick={() => selectedGroupType === 'PUBLIC' && !isMember && handleJoinGroup()}>
                        {selectedGroupType === 'PUBLIC' ? (isMember ? 'Joined' : 'Join') : 'Create'}
                    </button>

                </form>
                <label htmlFor="groupTypeFilter">Filter by Group Type:</label>
                <select
                    id="groupTypeFilter"
                    value={selectedGroupTypeFilter}
                    onChange={(e) => setSelectedGroupTypeFilter(e.target.value)}
                >
                    <option value="">All</option>
                    <option value="PUBLIC">Public</option>
                    <option value="PROTECT">Protected</option>
                    <option value="PRIVATE">Private</option>
                </select>
                <ul>
                    {groupsAndDms
                        .filter(group => !selectedGroupTypeFilter || group.type === selectedGroupTypeFilter)
                        .map((group, index) => (
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
                {currentChat && chatMessages[currentChat] ? (
                    chatMessages[currentChat].map((msg, index) => (
                        <div key={index}>{msg}</div>
                    ))
                ) : (
                    <p>No messages.</p>
                )}
            </div>
            {currentChat && (
                <div className="membersContainer">
                    <h1>Members: </h1>
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
    );
}    