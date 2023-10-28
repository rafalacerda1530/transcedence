import './App.css';
import Login from './components/login';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import CallBack from './components/callBack';


function App() {
  return (
    
    <Router>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/callback" element={<CallBack/>} />
      </Routes>
    </Router>
  );
}
export default App;
