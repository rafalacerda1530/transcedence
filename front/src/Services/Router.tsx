/* eslint-disable react/jsx-pascal-case */
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginGame from "../Pages/Login/login";
import { Home } from "../Pages/Home/Home";

export const Router = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/Login" element={<LoginGame />} />
        </Routes>
        <Routes>
          <Route path="/Callback" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};
