import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import io from 'socket.io-client';
import '../styles/ChatRoom.css';

const socket = io.connect('http://localhost:3001');

// Sound effects
const messageSound = new Audio('/sounds/message-sound.mp3');
const joinSound = new Audio('/sounds/join-sound.mp3');

function ChatRoom() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { topicId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [username, setUsername] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // Set initial username from Google display name
    setUsername(user.displayName);

    // Join room with email for unique identification
    socket.emit('join_room', {
      room: topicId,
      username: user.displayName,
      userId: user.uid,
      email: user.email
    });

    socket.on('username_taken', (data) => {
      setUsername(data.username);
      // Optional: Show a welcome back message
      setMessages(prev => [...prev, { system: true, text: data.message }]);
    });

    socket.on('receive_message', (data) => {
      setMessages(prev => [...prev, data]);
      messageSound.play().catch(err => console.log('Error playing sound:', err));
      scrollToBottom();
    });

    socket.on('message_history', (history) => {
      setMessages(history);
      scrollToBottom();
    });

    socket.on('user_joined', (data) => {
      setMessages(prev => [...prev, { system: true, text: data.message }]);
      setUsers(data.users);
      joinSound.play().catch(err => console.log('Error playing sound:', err));
      scrollToBottom();
    });

    socket.on('user_left', (data) => {
      setMessages(prev => [...prev, { system: true, text: data.message }]);
      setUsers(data.users);
      scrollToBottom();
    });

    socket.on('typing_status', (data) => {
      setTypingUsers(new Set(data.users));
    });

    return () => {
      socket.off('receive_message');
      socket.off('message_history');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('typing_status');
      socket.off('username_taken');
    };
  }, [user, topicId, navigate]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit('typing', {
      room: topicId,
      username: username, // Use tracked username
      isTyping: true
    });

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        room: topicId,
        username: username, // Use tracked username
        isTyping: false
      });
    }, 1000);
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const messageData = {
        room: topicId,
        user: username, // Use tracked username
        userId: user.uid,
        text: newMessage,
        time: new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).toLowerCase()
      };
      socket.emit('send_message', messageData);
      setNewMessage('');
      
      socket.emit('typing', {
        room: topicId,
        username: username, // Use tracked username
        isTyping: false
      });
    }
  };

  return (
    <div className="chat-room">
      <div className="chat-header">
        <h2>Chat Room: Topic Name</h2>
        <div className="online-count">Online Users: {users.length}</div>
      </div>
      
      <div className="chat-container">
        {/* Users Panel */}
        <div className="users-panel">
          <div className="panel-header">
            <h3>Who's Here</h3>
          </div>
          <div className="users-list">
            {users.map((username, index) => (
              <div key={index} className="user-item">
                <span className="user-icon">👤</span>
                <span className="user-name">{username}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Main Chat Area */}
        <div className="chat-main">
          <div className="messages-container">
            {messages.map((message, index) => (
              <div key={index} 
                className={`message ${message.system ? 'system-message' : ''} ${
                  message.userId === user?.uid ? 'my-message' : ''
                }`}
              >
                {message.system ? (
                  <div className="system-message-content">{message.text}</div>
                ) : (
                  <>
                    <div className="message-header">
                      <strong className="message-user">{message.user}</strong>
                      <span className="message-time">{message.time}</span>
                    </div>
                    <div className="message-content">
                      {message.text}
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {typingUsers.size > 0 && (
              <div className="typing-indicator">
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleMessageSubmit} className="message-form">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type your message..."
              className="message-input"
            />
            <button type="submit" className="send-button">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;
