/* eslint-disable react/jsx-pascal-case */
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginGame from "../Pages/Login/login";
import { Home } from "../Pages/Home/Home";
import { CallBack } from "../Pages/Callback/Callback";
import { Generate2fa } from "../Pages/Generate2fa/Generate2fa";

export const Router = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/Login" element={<LoginGame />} />
        </Routes>
        <Routes>
          <Route path="/Home" element={<Home />} />
        </Routes>
        <Routes>
          <Route path="/Callback" element={<CallBack />} />
        </Routes>
        <Routes>
          <Route path="/generate2fa" element={<Generate2fa />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};
