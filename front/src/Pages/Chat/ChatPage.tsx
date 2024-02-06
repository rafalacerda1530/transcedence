import React, { useContext, useEffect, useState } from 'react';
import './style.css'
import { ChatContext } from '../../context/ChatContext';
import { useRefreshToken } from "../../hooks/useRefreshToken";
import { axiosPrivate } from '../../hooks/useAxiosPrivate';
import { CallBackAllGroups } from './CallBack/CallBack';

interface Group {
    name: string;
    type: string;
}
interface Message {
    groupName: string;
    username: string;
    message: string;
    date: Date;
}

interface MessageFromBackend {
    date: string;
    content: string;
    group: {
        name: string;
    };
    sender: {
        user: string;
    };
}

interface GroupMember {
    username: string;
    isAdm: boolean;
}

export const ChatPage = () => {
    const chatSocket = useContext(ChatContext);
    const refreshToken = useRefreshToken();
    const [groupsAndDms, setGroupAndDms] = useState<Group[]>([]);
    const [currentChat, setCurrentChat] = useState<string | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [message, setMessage] = useState<string>('');
    const [newGroupName, setNewGroupName] = useState<string>('');
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string | null>(null);
    const [maxHeight, setMaxHeight] = useState<number>(0);
    const [groupType, setGroupType] = useState<string>('PUBLIC');
    const [selectedGroupType, setSelectedGroupType] = useState<string>('');
    const [selectedGroupTypeFilter, setSelectedGroupTypeFilter] = useState<string>('');
    const [allGroups, setAllGroups] = useState<Group[]>([]);
    const [joinPassword, setJoinPassword] = useState<string>('')
    const [chatMessages, setChatMessages] = useState<{ [groupName: string]: Message[] }>({});
    const [inviteUsernames, setInviteUsernames] = useState<{ [key: string]: string }>({});
    const [banList, setBanList] = useState([]);

    const [usernameToUnban, setUsernameToUnban] = useState('');

    const [isBanPopupOpen, setIsBanPopupOpen] = useState(false);
    const [banDuration, setBanDuration] = useState<number | null>(null);
    const [usernameToBan, setUsernameToBan] = useState<string>('')


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

    const handleInviteUser = async (groupName: string, userName: string) => {
        try {
            const invite = await axiosPrivate.put("/api/chat/inviteToGroup/", {
                admUsername: username,
                groupName: groupName,
                invitedUsername: userName
            })
            alert("Invite send to: " + userName)
        } catch (error) {
            throw new Error("Failed to invite user. Please check the entered username or if a request has already been sent");
        }
    }

    const checkInvitation = async (groupName: string, userName: string): Promise<boolean> => {
        try {
            const responseGroup = await axiosPrivate.get("/api/chat/groupId/" + groupName);
            const responseUser = await axiosPrivate.get("/api/chat/UserId/" + userName);

            const userId = Number(responseUser.data.id);
            const groupId = Number(responseGroup.data.id);

            if (isNaN(userId) || isNaN(groupId)) {
                throw new Error('Invalid userId or groupId');
            }

            const responseInvitation = await axiosPrivate.get(`/api/chat/CheckInvitationForUserGroup/${userId}/${groupId}`);

            return responseInvitation.data === true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };


    const handleInviteUsernameChange = (chatName: string, username: string) => {
        setInviteUsernames(prevState => ({
            ...prevState,
            [chatName]: username
        }));
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
            console.log('Group created:', response.data);
            setGroupAndDms([...groupsAndDms, { name: newGroupName, type: groupType }]);
            setAllGroups([...allGroups, { name: newGroupName, type: groupType }]);
            setNewGroupName('');
            setPassword('')
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };


    const calculateMaxHeight = () => {
        const windowHeight = window.innerHeight;
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
        const getGroupType = async () => {
            const selectedGroup = groupsAndDms.find(group => group.name === currentChat);
            if (selectedGroup) {
                setSelectedGroupType(selectedGroup.type);
            }
        };

        getGroupType();
    }, [currentChat, groupsAndDms]);


    useEffect(() => {
        const getMembersInGroup = async () => {
            try {
                if (!currentChat) {
                    return;
                }
                const response = await axiosPrivate.post('/api/chat/membersInChat', {
                    groupName: currentChat,
                    type: selectedGroupType,
                });
                const updatedMembers = response.data.map((member: any) => ({
                    username: member.username,
                    isAdm: member.isAdm,
                }))
                setMembers(updatedMembers);
            } catch (error) {
                console.error('Error fetching group members:', error);
            }
        };

        getMembersInGroup();
    }, [currentChat, groupType, username]);

    useEffect(() => {
        const fetchInitialGroups = async () => {
            try {
                const response = await CallBackAllGroups();
                setAllGroups(response.data);
            } catch (error) {
                console.error('Error fetching initial groups:', error);
            }
        };

        fetchInitialGroups();
    }, []);

    const handleJoinGroup = (groupName: string, password: string) => {
        const joinRequest = {
            username: username,
            groupName: groupName,
            password: password
        };
        chatSocket.emit('joinChat', joinRequest);
    };

    const sendMessageToServer = (groupName: string, message: string) => {
        if (!groupName || !message || !username) return;
        const messageRequest = {

            groupName: groupName,
            username: username,
            message: message,
        }
        chatSocket.emit('messageToServer', messageRequest)
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (currentChat && message) {
            sendMessageToServer(currentChat, message);
            setMessage('');
        }
    };

    useEffect(() => {
        chatSocket.on("messageToClient", (message: Message) => {
            if (!message || !message.groupName) return;
            setChatMessages(prevMessages => ({
                ...prevMessages,
                [message.groupName]: [...(prevMessages[message.groupName] || []), message],
            }));
        });

        return () => {
            chatSocket.off("messageToClient");
        };
    }, [chatSocket]);

    const getMessageClass = (target: string) => {
        return username === target ? 'messageSelf' : 'messageOther';
    };

    useEffect(() => {
        const fetchGroupMessages = async () => {
            try {
                const response = await axiosPrivate.get<MessageFromBackend[]>(`/api/chat/groupMessages/${currentChat}`);

                const formattedMessages = response.data.map((message: MessageFromBackend) => ({
                    groupName: message.group.name,
                    username: message.sender.user,
                    date: new Date(message.date),
                    message: message.content,
                }));

                setChatMessages(prevMessages => ({
                    ...prevMessages,
                    [currentChat as string]: formattedMessages,
                }));
            } catch (error) {
                console.error('Error fetching group messages:', error);
            }
        };

        if (currentChat) {
            fetchGroupMessages();
        }
    }, [currentChat]);

    const handleOpenGroup = (groupName: string, groupType: string) => {
        const isMember = groupsAndDms.some(g => g.name === groupName);
        if (isMember) {
            setCurrentChat(groupName);
            setSelectedGroupType(groupType);
        }
    }

    //TODO TEST
    const handleKickUser = async (target: string) => {
        try {
            // Faça uma solicitação para o backend para executar o kick
            await axiosPrivate.put('/api/chat/kickUser', {
                groupName: currentChat,
                admUsername: username,
                targetUsername: target
            });

            // Atualize a lista de membros após o kick
            setMembers(prevMembers => prevMembers.filter(member => member.username !== username));
        } catch (error) {
            console.error('Error kicking user:', error);
        }
    };

    const handleBanUser = async () => {
        try {
            await axiosPrivate.put('/api/chat/banUser', {
                groupName: currentChat,
                admUsername: username,
                targetUsername: usernameToBan,
                banDuration: banDuration,
            });
            setMembers(prevMembers => prevMembers.filter(member => member.username !== usernameToBan));
            setIsBanPopupOpen(false);
        } catch (error) {
            console.error('Error banning user:', error);
        }
    };


    //TODO TEST
    useEffect(() => {
        if (currentChat) {
            // Aqui você pode fazer uma solicitação ao backend para obter a lista de usuários banidos
            const fetchBanList = async () => {
                console.log(currentChat);
                try {
                    const response = await axiosPrivate.get(`api/chat/ban/list/${currentChat}`);
                    setBanList(response.data);
                } catch (error) {
                    console.error('Error fetching ban list:', error);
                }
            };

            fetchBanList();
        }
    }, [currentChat]);

    const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUsernameToUnban(event.target.value);
    };

    const handleUnbanUser = async (usernameToUnban: string) => {
        try {
            await axiosPrivate.put('/api/chat/unban', {
                groupName: currentChat,
                admUsername: username,
                targetUsername: usernameToUnban
            });
            console.log('deu???')
            const updatedBanList = banList.filter(user => user !== usernameToUnban);
            setBanList(updatedBanList);
            setUsernameToUnban('');
        } catch (error) {
            console.error('Error unbanning user:', error);
        }
    };

    const handleOpenBanPopup = (target: string) => {
        setUsernameToBan(target);
        setIsBanPopupOpen(true);

    }
    const handleCloseBanPopup = () => {
        setIsBanPopupOpen(false);
    }

    const handleBanDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const duration = parseInt(event.target.value);
        setBanDuration(duration);
    };


    return (
        <div className="chatPageContainer">
            <div className="groupDmsContainer" style={{ maxHeight: `${maxHeight}px` }}>
                <a href="/home" className="homeButton">Go to Home</a>
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
                    <button type="submit" className="createGroupButton">Create</button>
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
                    {allGroups
                        .filter(group => !selectedGroupTypeFilter || group.type === selectedGroupTypeFilter)
                        .map((group, index) => {
                            const isMember = groupsAndDms.some(g => g.name === group.name);
                            const currentChatInviteUsername = inviteUsernames[group.name] || '';

                            return (
                                <li key={index} onClick={() => handleOpenGroup(group.name, group.type)}>
                                    {group.name}
                                    <span className="groupTypeIndicator">({group.type})</span>
                                    {isMember ? (
                                        <div>
                                            <span> - Member</span>
                                            {group.type === 'PRIVATE' && (
                                                <div className="flex items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter username to invite"
                                                        value={currentChatInviteUsername}
                                                        onChange={(e) => handleInviteUsernameChange(group.name, e.target.value)}
                                                        className="w-32 h-8 px-2 rounded-full border border-gray-300"
                                                    />
                                                    <button className="ml-2 py-2 px-4 rounded bg-black text-white"
                                                        onClick={async () => {
                                                            try {
                                                                await handleInviteUser(group.name, currentChatInviteUsername);
                                                            } catch (error) {
                                                                alert('Error inviting user: ' + error);
                                                                console.error(error);
                                                            }
                                                        }}
                                                    >
                                                        Invite User
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            {group.type === 'PROTECT' ? (
                                                <div>
                                                    <input
                                                        type="password"
                                                        placeholder="Enter group password"
                                                        value={joinPassword}
                                                        onChange={(e) => setJoinPassword(e.target.value)}
                                                    />
                                                    <button className="createGroupButton" onClick={() => handleJoinGroup(group.name, joinPassword)}>
                                                        Join Group
                                                    </button>
                                                </div>
                                            ) : (
                                                <button className="createGroupButton" onClick={() => handleJoinGroup(group.name, '')}>
                                                    Join Group
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </li>
                            );
                        })
                    }
                </ul>
            </div>
            <div className="chatContainer">
                {currentChat && chatMessages[currentChat] ? (
                    chatMessages[currentChat].map((msg, index) => (
                        <div key={index} className={getMessageClass(msg.username)}>
                            <p>{msg.username}: {msg.message}</p>
                            <p>{new Date(msg.date).toLocaleString()}</p>
                        </div>
                    ))
                ) : (
                    <p></p>
                )}
            </div>
            {currentChat && (
                <div className="membersContainer">
                    <h1>Members: </h1>
                    <ul>
                        {members.map((member, index) => (
                            <li key={index} className={member.isAdm ? "adminMember" : "regularMember"}>
                                {member.username}
                                {username !== member.username && !member.isAdm && (
                                    <div>
                                        <button className="kickButton" onClick={() => handleKickUser(member.username)}>K</button>
                                        <button className="banButton" onClick={() => handleOpenBanPopup(member.username)}>Ban</button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                    <div>
                        <h2>Ban Management</h2>
                        <div>
                            <h3>Ban List</h3>
                            <ul>
                                {banList.map((user, index) => (
                                    <li key={index}>
                                        {user}
                                        <button className="unbanButton" onClick={() => handleUnbanUser(user)}>Unban</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
            {isBanPopupOpen && (
                <div className="banPopup">
                    <input
                        type="number"
                        value={banDuration || ''}
                        onChange={handleBanDurationChange}
                        placeholder="Ban duration (minutes)"
                    />
                    {/* Passe o usuário correto para banir ao clicar em "Confirmar" */}
                    <button onClick={handleBanUser}>Confirm</button>
                    <button onClick={handleCloseBanPopup}>Cancel</button>
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
