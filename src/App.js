import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import './App.css';
import LandingPage from './pages/LandingPage';
import ChatRoom from './pages/ChatRoom';
import Auth from './components/Auth';
import { auth } from './config/firebase';
import './styles/Auth.css';

function App() {
  const [user] = useAuthState(auth);

  return (
    <Router>
      <div className="App">
        <Auth />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/chat/:topicId" 
            element={user ? <ChatRoom /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
