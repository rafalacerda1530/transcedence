import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginGame from "../Pages/Login/login";
import { Home } from "../Pages/Home/Home";
import { CallBack } from "../Pages/Callback/Callback";
import { Generate2fa } from "../Pages/Generate2fa/Generate2fa";
import FriendsList from "../Pages/FriendList/FriendList";
import Profile from "../Pages/Profile/Profile";
import { GameProvider, gameSocket } from "../context/GameContext";
import { QueueGame } from "../Pages/Queue/Queue";
import { Game } from "../Pages/Game/Game";
import { QueueProvider, queueSocket } from "../context/QueueContext";
import { MatchHistoryComplete } from "../Pages/MatchHistory/MatchHistory";
import { StatusProvider, statusSocket } from "../context/StatusContext";
import { ChatProvider, chatSocket } from "../context/ChatContext";
import {ChatPage} from "../Pages/Chat/ChatPage";


export const Router = () => {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/home" />} />
                    <Route path="/login" element={<LoginGame />} />
                </Routes>
                <QueueProvider value={queueSocket}>
                    <Routes>
                        <Route path="/queue" element={<QueueGame />} />
                    </Routes>
                </QueueProvider>
                <GameProvider value={gameSocket}>
                    <Routes>
                        <Route path="/game" element={<Game />} />
                    </Routes>
                </GameProvider>
                <StatusProvider value={statusSocket}>
                    <Routes>
                        <Route path="/home" element={<Home />} />
                    </Routes>
                </StatusProvider>
                <Routes>
                    <Route path="/profile" element={<Profile />} />
                </Routes>
                <Routes>
                    <Route path="/callback" element={<CallBack />} />
                </Routes>
                <Routes>
                    <Route path="/generate2fa" element={<Generate2fa />} />
                </Routes>
                <Routes>
                    <Route path="/user/:username" element={<FriendsList />} />
                </Routes>

                <StatusProvider value={statusSocket}>
                    <Routes>
                        <Route path="/matchHistoryComplete/:user" element={<MatchHistoryComplete/>} />
                    </Routes>
                </StatusProvider>

                <ChatProvider value={chatSocket}>
                <Routes>
                    <Route path="/chat" element={<ChatPage/>} />
                </Routes>
                </ChatProvider>

            </BrowserRouter>
        </>
    );
};
