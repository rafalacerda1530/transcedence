/* eslint-disable react/jsx-pascal-case */
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

export const Router = () => {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/Login" element={<LoginGame />} />
                </Routes>
                <QueueProvider value={queueSocket}>
                    <Routes>
                        <Route path="/Queue" element={<QueueGame />} />
                    </Routes>
                </QueueProvider>
                <GameProvider value={gameSocket}>
                    <Routes>
                        <Route path="/Game" element={<Game />} />
                    </Routes>
                </GameProvider>
                <Routes>
                        <Route path="/Home" element={<Home />} />
                </Routes>
				<Routes>
                    <Route path="/Profile" element={<Profile />} />
                </Routes>
                <Routes>
                    <Route path="/Callback" element={<CallBack />} />
                </Routes>
                <Routes>
                    <Route path="/generate2fa" element={<Generate2fa />} />
                </Routes>
                <Routes>
                    <Route path="/user/:username" element={<FriendsList />} />
                </Routes>

            </BrowserRouter>
        </>
    );
};
