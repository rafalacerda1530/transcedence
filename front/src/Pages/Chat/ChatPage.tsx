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
    groupName: string;
    username: string;
    isAdm: boolean;
    isMuted: boolean;
}

export const ChatPage = () => {
    const chatSocket = useContext(ChatContext);
    const refreshToken = useRefreshToken();
    const [groupsAndDms, setGroupAndDms] = useState<Group[]>([]);
    const [currentChat, setCurrentChat] = useState<string | null>(null);
    const [groupMembers, setGroupMembers] = useState<{ [groupName: string]: GroupMember[] }>({});
    const [message, setMessage] = useState<string>('');
    const [newGroupName, setNewGroupName] = useState<string>('');
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string | null>(null);
    const [maxHeight, setMaxHeight] = useState<number>(0);
    const [groupType, setGroupType] = useState<string>('PUBLIC');
    const [selectedGroupTypeFilter, setSelectedGroupTypeFilter] = useState<string>('');
    const [allGroups, setAllGroups] = useState<Group[]>([]);
    const [joinPassword, setJoinPassword] = useState<string>('')
    const [chatMessages, setChatMessages] = useState<{ [groupName: string]: Message[] }>({});
    const [inviteUsernames, setInviteUsernames] = useState<{ [key: string]: string }>({});
    const [banList, setBanList] = useState<string[]>([]);
    const [isBanPopupOpen, setIsBanPopupOpen] = useState(false);
    const [banDuration, setBanDuration] = useState<number | null>(null);
    const [usernameToBan, setUsernameToBan] = useState<string>('')
    const [isMutePopupOpen, setIsMutePopupOpen] = useState(false);
    const [muteDuration, setMuteDuration] = useState<number | null>(null);
    const [usernameToMute, setUsernameToMute] = useState<string>('');
    const [isChangePasswordPopupOpen, setIsChangePasswordPopupOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

    const [dmGroups, setDmGroups] = useState<Group[]>([]);
    const [directChatMembers, setDirectChatMembers] = useState<string[]>([]);
    const [isSocketConnected, setIsSocketConnected] = useState(false);





    const connectSocket = () => {
        chatSocket.connect();
        chatSocket.on("connect", () => {
            console.log("----------Conectado ao socket");
            setIsSocketConnected(true); // Define a flag para verdadeira quando a conexão é estabelecida

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
    useEffect(() => {

        const fetchInitialDmGroups = async () => {
            if (isSocketConnected) {
                try {
                    const response = await axiosPrivate.post(`/api/chat/allDm`, {
                        username: username,
                    });
                    const dmGroupsData: Group[] = response.data.map((groupName: string) => ({
                        name: groupName,
                        type: 'DIRECT', // Definir o tipo como 'direct' para todos os grupos
                    }));
                    setDmGroups(dmGroupsData);

                } catch (error) {
                    console.error('Error fetching initial DM groups:', error);
                }
            }
        };

        fetchInitialDmGroups();
    }, [isSocketConnected, username]);


    useEffect(() => {
        const fetchBlockedUsersStatus = async () => {
            if (currentChat && !isDirectChat(currentChat)) {

                try {
                    const response = await axiosPrivate.get(`/api/chat/blockedList/${username}`);
                    setBlockedUsers(response.data);
                } catch (error) {
                    console.error('Error fetching blocked user list:', error);
                }
            }
        };

        fetchBlockedUsersStatus();
    }, [username]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(event.target.value);
    };

    const handleInviteUser = async (groupName: string, userName: string) => {
        try {
            await axiosPrivate.put("/api/chat/inviteToGroup/", {
                admUsername: username,
                groupName: groupName,
                invitedUsername: userName
            })
            alert("Invite send to: " + userName)
        } catch (error) {
            throw new Error("Failed to invite user. Please check the entered username or if a request has already been sent");
        }
    }

    // const checkInvitation = async (groupName: string, userName: string): Promise<boolean> => {
    //     try {
    //         const responseGroup = await axiosPrivate.get("/api/chat/groupId/" + groupName);
    //         const responseUser = await axiosPrivate.get("/api/chat/UserId/" + userName);

    //         const userId = Number(responseUser.data.id);
    //         const groupId = Number(responseGroup.data.id);

    //         if (isNaN(userId) || isNaN(groupId)) {
    //             throw new Error('Invalid userId or groupId');
    //         }

    //         const responseInvitation = await axiosPrivate.get(`/api/chat/CheckInvitationForUserGroup/${userId}/${groupId}`);

    //         return responseInvitation.data === true;
    //     } catch (error) {
    //         console.error(error);
    //         return false;
    //     }
    // };


    const handleInviteUsernameChange = (chatName: string, username: string) => {
        setInviteUsernames(prevState => ({
            ...prevState,
            [chatName]: username
        }));
    };

    const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            chatSocket.emit('createGroup', {
                type: groupType,
                groupName: newGroupName,
                ownerUsername: username,
                password: groupType === "PROTECT" ? password : null
            });
            setNewGroupName('');
            setPassword('');
        } catch (error) {
            console.error('Error emitting createGroup event:', error);
        }
    };

    useEffect(() => {
        chatSocket.on('joinOwnerOnGroup', ({ name, type }) => {
            setGroupAndDms(prevGroups => [...prevGroups, { name, type }]);
        });

        return () => {
            chatSocket.off('joinOwnerOnGroup');
        };
    }, [chatSocket]);

    useEffect(() => {
        chatSocket.on('groupCreated', ({ name, type }) => {
            setAllGroups(prevAllGroups => [...prevAllGroups, { name, type }]);
        });

        return () => {
            chatSocket.off('groupCreated');
        };
    }, [chatSocket]);

    useEffect(() => {
        chatSocket.on('joinedGroup', ({ groupName, userUsername, type }) => {
            const isGroupInList = groupsAndDms.some(group => group.name === groupName);
            const isAlreadyMember = isGroupInList && groupMembers[groupName]?.some(member => member.username === userUsername);
            console.log("teste")

            if (!isAlreadyMember) {
                setGroupMembers(prevGroupMembers => ({
                    ...prevGroupMembers,
                    [groupName]: [
                        ...(prevGroupMembers[groupName] || []),
                        { username: userUsername, isAdm: false, isMuted: false } // Assume-se que o novo usuário não é um administrador por padrão
                    ]
                }));

                setGroupAndDms(prevGroups => [...prevGroups, { name: groupName, type }]);
            }
        });

        return () => {
            chatSocket.off('joinedGroup');
        };
    }, [chatSocket, groupsAndDms, groupMembers]);

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
        chatSocket.on('membersInGroup', (groupName, updatedMembers: GroupMember[]) => {
            setGroupMembers(prevGroupMembers => ({
                ...prevGroupMembers,
                [groupName]: updatedMembers,
            }));
        });

        return () => {
            chatSocket.off('membersInGroup');
        };
    }, [chatSocket, groupMembers]);

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

    const dmSendMessageToServer = (groupName: string, message: string) => {
        if (!groupName || !message || !username) return;
        const messageRequest = {

            groupName: groupName,
            username: username,
            message: message,
        }
        chatSocket.emit('DmMessageToServer', messageRequest)
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const isDm = isDirectChat(currentChat);
        if (currentChat && message && !isDm) {
            sendMessageToServer(currentChat, message);
            setMessage('');
        }
        if (currentChat && message && isDm) {
            dmSendMessageToServer(currentChat, message);
            setMessage('');
        }
    };

    const isUserBlocked = (username: string) => {
        return blockedUsers.includes(username);
    };

    useEffect(() => {
        chatSocket.on("messageToClient", (message: Message) => {
            if (!message || !message.groupName || isUserBlocked(message.username)) {
                return;
            }
            setChatMessages(prevMessages => ({
                ...prevMessages,
                [message.groupName]: [...(prevMessages[message.groupName] || []), message],
            }));
        });

        return () => {
            chatSocket.off("messageToClient");
        };
    }, [chatSocket, isUserBlocked]);


    const getMessageClass = (target: string) => {
        return username === target ? 'messageSelf' : 'messageOther';
    };

    useEffect(() => {
        const fetchGroupMessages = async () => {
            try {
                if (!isDirectChat(currentChat)) {
                    const response = await axiosPrivate.get<MessageFromBackend[]>(`/api/chat/groupMessages/${currentChat}`);
                    const formattedMessages = response.data.map((message: MessageFromBackend) => ({
                        groupName: message.group.name,
                        username: message.sender.user,
                        date: new Date(message.date),
                        message: message.content,
                    }));
                    const filteredMessages = formattedMessages.filter(message => !isUserBlocked(message.username));
                    console.log(filteredMessages)
                    setChatMessages(prevMessages => ({
                        ...prevMessages,
                        [currentChat as string]: filteredMessages,
                    }));
                } else {
                    const response = await axiosPrivate.get<MessageFromBackend[]>(`/api/chat/dmGroupMessages/${currentChat}`);
                    const formattedMessages = response.data.map((message: MessageFromBackend) => ({
                        groupName: message.group.name,
                        username: message.sender.user,
                        date: new Date(message.date),
                        message: message.content,
                    }));
                    const filteredMessages = formattedMessages.filter(message => !isUserBlocked(message.username));
                    console.log(filteredMessages)
                    setChatMessages(prevMessages => ({
                        ...prevMessages,
                        [currentChat as string]: filteredMessages,
                    }));

                }
            } catch (error) {
                console.error('Error fetching group messages:', error);
            }
        };

        if (currentChat) {
            fetchGroupMessages();
        }
    }, [currentChat]);

    const handleOpenGroup = async (groupName: string, groupType: string) => {
        if (groupType === 'DIRECT') {
            setCurrentChat(groupName);
            const response = await axiosPrivate.get(`/api/chat/direct-chat/${groupName}/members`);
            console.log(response.data)
            setDirectChatMembers(response.data);
        }
        else {
            const isMember = groupsAndDms.some(g => g.name === groupName);
            if (isMember) {
                setCurrentChat(groupName);
                chatSocket.emit('getMembersInGroup', {
                    groupName: groupName,
                    type: groupType
                });
            }
        }
    }

    const handleKickUser = async (target: string) => {
        try {
            chatSocket.emit('kickUser', {
                groupName: currentChat,
                admUsername: username,
                targetUsername: target
            });
        } catch (error) {
            console.error('Error kicking user:', error);
        }
    };

    const handleBanUser = () => {
        try {
            chatSocket.emit('banUser', {
                groupName: currentChat,
                admUsername: username,
                targetUsername: usernameToBan,
                banDuration: banDuration,
            });
            setIsBanPopupOpen(false);
        } catch (error) {
            console.error('Error banning user:', error);
        }
    };
    useEffect(() => {
        chatSocket.on('userBanned', (bannedUser) => {
            setBanList(prevBanList => [...prevBanList, bannedUser]);
        });

        return () => {
            chatSocket.off('userBanned');
        };
    }, [chatSocket]);


    const handleUnbanUser = (usernameToUnban: string) => {
        try {
            chatSocket.emit('unbanUser', {
                groupName: currentChat,
                admUsername: username,
                targetUsername: usernameToUnban,
            });
        } catch (error) {
            console.error('Error unbanning user:', error);
        }
    };

    useEffect(() => {
        chatSocket.on('userUnbanned', (username: string) => {
            setBanList(prevBanList => prevBanList.filter(user => user !== username));
        });

        return () => {
            chatSocket.off('userUnbanned');
        };
    }, [chatSocket]);

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

    useEffect(() => {
        if (currentChat && !isDirectChat(currentChat)) {
            const fetchBanList = async () => {
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

    const handleSetAdmin = (target: string) => {
        try {
            console.log(currentChat)
            chatSocket.emit('setAdm', {
                groupName: currentChat,
                admUsername: username,
                targetUsername: target
            });
        } catch (error) {
            console.error('Error setting admin:', error);
        }
    };
    useEffect(() => {
        chatSocket.on('setAdmResponse', ({ groupName, targetUsername }) => {
            setGroupMembers(prevGroupMembers => {
                const updatedMembers = prevGroupMembers[groupName].map(member => {
                    if (member.username === targetUsername) {
                        return { ...member, isAdm: true };
                    }
                    return member;
                });
                return {
                    ...prevGroupMembers,
                    [groupName]: updatedMembers
                };
            });
        });
    }, [chatSocket, setGroupMembers]);

    const handleUnsetAdmin = (target: string) => {
        try {
            chatSocket.emit('unsetAdm', {
                groupName: currentChat,
                admUsername: username,
                targetUsername: target
            });
        } catch (error) {
            console.error('Error unsetting admin:', error);
        }
    };
    useEffect(() => {
        chatSocket.on('unsetAdmResponse', ({ groupName, targetUsername }) => {
            setGroupMembers(prevGroupMembers => {
                const updatedMembers = prevGroupMembers[groupName].map(member => {
                    if (member.username === targetUsername) {
                        return { ...member, isAdm: false };
                    }
                    return member;
                });
                return {
                    ...prevGroupMembers,
                    [groupName]: updatedMembers
                };
            });
        });
    }, [chatSocket, setGroupMembers]);

    const handleOpenMutePopup = (target: string) => {
        setUsernameToMute(target);
        setIsMutePopupOpen(true);
    };

    const handleCloseMutePopup = () => {
        setIsMutePopupOpen(false);
    };

    const handleMuteDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const duration = parseInt(event.target.value);
        setMuteDuration(duration);
    };

    useEffect(() => {
        chatSocket.on('muteUserResponse', ({ groupName, targetUsername }) => {
            setGroupMembers(prevGroupMembers => {
                const updatedMembers = prevGroupMembers[groupName].map(member => {
                    if (member.username === targetUsername) {
                        return { ...member, isMuted: true };
                    }
                    return member;
                });
                return {
                    ...prevGroupMembers,
                    [groupName]: updatedMembers
                };
            });
            console.log(groupMembers[groupName])
        });

        return () => {
            chatSocket.off('muteUserResponse');
        };
    }, [chatSocket, setGroupMembers]);


    const handleMuteUser = () => {
        try {
            chatSocket.emit('muteUser', {
                groupName: currentChat,
                admUsername: username,
                targetUsername: usernameToMute,
                muteDuration: muteDuration,
            });
            setIsMutePopupOpen(false);
        } catch (error) {
            console.error('Error muting user:', error);
        }
    };

    const handleUnmuteUser = (target: string) => {
        try {
            chatSocket.emit('removeMute', {
                groupName: currentChat,
                admUsername: username,
                targetUsername: target,
            });
        } catch (error) {
            console.error('Error muting user:', error);
        }
    };

    useEffect(() => {
        chatSocket.on('removeMuteUserResponse', ({ groupName, targetUsername }) => {
            setGroupMembers(prevGroupMembers => {
                const updatedMembers = prevGroupMembers[groupName].map(member => {
                    if (member.username === targetUsername) {
                        return { ...member, isMuted: false };
                    }
                    return member;
                });
                return {
                    ...prevGroupMembers,
                    [groupName]: updatedMembers
                };
            });
        });

        return () => {
            chatSocket.off('muteUserResponse');
        };
    }, [chatSocket, setGroupMembers]);


    const openChangePasswordPopup = () => {
        setIsChangePasswordPopupOpen(true);
    };
    const closeChangePasswordPopup = () => {
        setIsChangePasswordPopupOpen(false);
    };
    const handleChangePassword = () => {
        try {
            const passwordToSend = newPassword.trim() === '' ? null : newPassword;
            chatSocket.emit('changeChannelPass', {
                groupName: currentChat,
                ownerUsername: username,
                password: passwordToSend
            });
            setIsChangePasswordPopupOpen(false);
        } catch (error) {
            console.error('Error changing the group type:', error);
        }
    };
    useEffect(() => {
        chatSocket.on('groupTypeUpdated', ({ groupName, type }) => {
            setGroupAndDms((prevGroups) =>
                prevGroups.map((group) =>
                    group.name === groupName ? { ...group, type } : group
                )
            );
        });

        return () => {
            chatSocket.off('groupTypeUpdated');
        };
    }, [chatSocket]);

    const handleSetOnlyInvite = () => {
        try {
            chatSocket.emit('setChannelOnlyInvite', {
                groupName: currentChat,
                ownerUsername: username,
            });
        } catch (error) {
            console.error('Error muting user:', error);
        }
    };

    const handleBlock = (target: string) => {
        try {
            chatSocket.emit('blockUser', {
                userUsername: username,
                targetUsername: target
            });
        } catch (error) {
            console.error('Error blocking user:', error);
        }
    };
    useEffect(() => {
        chatSocket.on('blockUserResponse', ({ target }) => {
            setBlockedUsers(prevBlockedUsers => [...prevBlockedUsers, target]);
        });

        return () => {
            chatSocket.off('blockUserResponse');
        };
    }, []);
    const unblockUser = (target: string) => {
        try {
            chatSocket.emit('unblockUser', {
                userUsername: username,
                targetUsername: target
            });
        } catch (error) {
            console.error('Error unblocking user:', error);
        }
    };
    useEffect(() => {
        chatSocket.on('unblockUserResponse', ({ target }) => {
            setBlockedUsers(prevBlockedUsers => prevBlockedUsers.filter(user => user !== target));
        });

        return () => {
            chatSocket.off('unblockUserResponse');
        };
    }, []);

    const isAdmin = (currentUser: string, groupMembers: { [groupName: string]: GroupMember[] }, currentChat: string | null): boolean => {
        if (!currentChat) return false; // Se não houver chat selecionado, o usuário não é um administrador
        const members = groupMembers[currentChat];
        if (!members) return false; // Se não houver membros no chat, o usuário não é um administrador
        const currentUserInChat = members.find(member => member.username === currentUser);
        return currentUserInChat ? currentUserInChat.isAdm : false;
    };

    useEffect(() => {
        chatSocket.on('DmGroupCreated', ({ name, type }) => {
            setDmGroups(prevAllGroups => [...prevAllGroups, { name, type }]);
        });

        return () => {
            chatSocket.off('DmGroupCreated');
        };
    }, [chatSocket]);
    function isDirectChat(chat: string | null): boolean {
        return chat !== null && chat.startsWith("Dm-");
    }


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
                    <option value="DIRECT">Direct</option>
                </select>

                <ul>
                    {/* Renderizar os grupos de mensagens diretas */}
                    {dmGroups
                        .filter(group => !selectedGroupTypeFilter || group.type === selectedGroupTypeFilter)
                        .map((group, index) => (
                            <li key={index} onClick={() => handleOpenGroup(group.name, group.type)}>
                                {group.name}
                                <span className="groupTypeIndicator">Direct</span>
                                {/* Adicionar lógica adicional conforme necessário para as mensagens diretas */}
                            </li>
                        ))}
                </ul>


                <ul>
                    {allGroups
                        .filter(group => !selectedGroupTypeFilter || group.type === selectedGroupTypeFilter)
                        .map((group, index) => {
                            const isMember = groupsAndDms.some(g => g.name === group.name);
                            const currentChatInviteUsername = inviteUsernames[group.name] || '';

                            return (
                                <li key={index} onClick={() => handleOpenGroup(group.name, group.type)}>
                                    {group.name}
                                    <span className="groupTypeIndicator">
                                        {groupsAndDms.find(g => g.name === group.name)?.type || group.type}
                                    </span>

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
                    {isAdmin(username, groupMembers, currentChat) && (

                        <div>
                            {currentChat && (
                                <button onClick={openChangePasswordPopup} className="changePasswordButton">Change Password</button>
                            )}
                            {currentChat && (
                                <button onClick={handleSetOnlyInvite} className="setOnlyInviteButton">Set Only Invite</button>
                            )}
                            {isChangePasswordPopupOpen && (
                                <div className="changePasswordPopup">
                                    <h2>Change Password</h2>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="leave blank for no password"
                                    />
                                    <button className="confirmButton" onClick={handleChangePassword}>Change Password</button>
                                    <button className="cancelButton" onClick={closeChangePasswordPopup}>Cancel</button>
                                </div>
                            )}
                        </div>
                    )}
                    <h3>Members: </h3>
                    {isDirectChat(currentChat) && (
                        <div>
                            <ul>
                                {directChatMembers.map((member, index) => (
                                    <li key={index}>
                                        <a href={`/matchHistoryComplete/${member}`} className="memberName text-lg font-bold">{member}</a>
                                        {username !== member && (
                                            <div className="buttonGroup">
                                                {!blockedUsers.includes(member) ? (
                                                    <button className="blockButton" onClick={() => handleBlock(member)}>Block</button>
                                                ) : (
                                                    <button className="unblockButton" onClick={() => unblockUser(member)}>Unblock</button>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <ul>
                        {groupMembers[currentChat]?.map((member, index) => (
                            <li key={index} className={member.isAdm ? "adminMember" : "regularMember"}>
                                <a href={`/matchHistoryComplete/${member.username}`} className="memberName text-lg font-bold">{member.username}</a>
                                {isAdmin(username, groupMembers, currentChat) && username !== member.username && (
                                    <div className="buttonGroup">
                                        <button className="kickButton" onClick={() => handleKickUser(member.username)}>Kick</button>
                                        <button className="banButton" onClick={() => handleOpenBanPopup(member.username)}>Ban</button>
                                        {member.isMuted ? (
                                            <button className="unmuteButton" onClick={() => handleUnmuteUser(member.username)}>Unmute</button>
                                        ) : (
                                            <button className="muteButton" onClick={() => handleOpenMutePopup(member.username)}>Mute</button>
                                        )}
                                        {!blockedUsers.includes(member.username) ? (
                                            <button className="blockButton" onClick={() => handleBlock(member.username)}>Block</button>
                                        ) : (
                                            <button className="unblockButton" onClick={() => unblockUser(member.username)}>Unblock</button>
                                        )}
                                        {!member.isAdm ? (
                                            <button className="setAdminButton" onClick={() => handleSetAdmin(member.username)}>S/Adm</button>
                                        ) : (
                                            <button className="unsetAdminButton" onClick={() => handleUnsetAdmin(member.username)}>U/Adm</button>
                                        )}
                                    </div>
                                )}

                                {!isAdmin(username, groupMembers, currentChat) && username !== member.username && (
                                    <div className="buttonGroup">
                                        {!blockedUsers.includes(member.username) ? (
                                            <button className="blockButton" onClick={() => handleBlock(member.username)}>Block</button>
                                        ) : (
                                            <button className="unblockButton" onClick={() => unblockUser(member.username)}>Unblock</button>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                    {!isDirectChat(currentChat) && (
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
                    )}
                </div>
            )}
            {isMutePopupOpen && (
                <div className="mutePopup">
                    <input
                        type="number"
                        value={muteDuration || ''}
                        onChange={handleMuteDurationChange}
                        placeholder="Mute duration (minutes)"
                    />
                    {/* Passe o usuário correto para mutar ao clicar em "Confirmar" */}
                    <button onClick={handleMuteUser}>Confirm</button>
                    <button onClick={handleCloseMutePopup}>Cancel</button>
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
