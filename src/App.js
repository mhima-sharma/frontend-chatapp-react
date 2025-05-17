import "./App.css";
import LoginSignup from "./components/loginSignup";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/dashboard';
import Userchat from './components/Userchat'
import GroupChat from "./components/GroupChat";

function App() {
  return (
    
    
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/userchat" element={<Userchat />} />
        <Route path="/groupchat" element={<GroupChat />} />

        {/* <Route path="/userchat" element={<Userchat />} /> */}

      </Routes>
    </Router>
  );
}

export default App;
