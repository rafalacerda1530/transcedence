import './App.css';
import Login from './components/login';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import React from 'react';
import './index.css'
import Login_game from './layout/login/login';

function App() {
  return (
    <Login_game/>
    //<Router>
    //  <Routes>
    //    <Route path="/" element={<Login/>} />
    //    <Route path="/callback" element={<CallBack/>} />
    //  </Routes>
    //</Router>
  );
}
export default App;
