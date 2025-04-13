import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';

const topics = [
  { id: 1, title: "Cricket Semi-Final", emoji: "🏏" },
  { id: 2, title: "Elections 2025", emoji: "🗳️" },
  { id: 3, title: "Movie Premiere", emoji: "🎬" }
];

function LandingPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  const handleTopicClick = (topicId) => {
    if (user) {
      navigate(`/chat/${topicId}`);
    }
  };

  return (
    <div className="landing-page">
      <h1>Welcome to Baatcheet!</h1>
      
      {!user && (
        <div className="auth-message">
          <p>Sign in to continue</p>
        </div>
      )}

      <div className="topics-section">
        <h2>Today's Hot Topics:</h2>
        <div className="topics-container">
          {topics.map(topic => (
            <div 
              key={topic.id} 
              className={`topic-item ${!user ? 'disabled' : ''}`}
              onClick={() => handleTopicClick(topic.id)}
            >
              {topic.emoji} {topic.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
