const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();
const messageHistory = new Map();
const typingUsers = new Map();
const userSocketMap = new Map();
const userEmailMap = new Map(); // New: Track email to username mapping

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (data) => {
    const { room, username, userId, email } = data;
    const roomKey = `${room}:${email}`;

    // Check if user already exists in this room
    if (userEmailMap.has(roomKey)) {
      // User is rejoining
      const existingUsername = userEmailMap.get(roomKey);
      socket.emit('username_taken', {
        message: `Welcome back ${existingUsername}!`,
        username: existingUsername
      });
      data.username = existingUsername;
    } else {
      // New user
      userEmailMap.set(roomKey, username);
    }

    socket.join(room);
    
    // Initialize room if doesn't exist
    if (!rooms.has(room)) {
      rooms.set(room, new Set());
      messageHistory.set(room, []);
      typingUsers.set(room, new Set());
    }

    const roomUsers = rooms.get(room);
    roomUsers.add(data.username);

    // Store socket info for disconnect handling
    userSocketMap.set(socket.id, { 
      room, 
      username: data.username, 
      email,
      roomKey 
    });

    // Send message history
    socket.emit('message_history', messageHistory.get(room));

    // Broadcast user joined
    io.to(room).emit('user_joined', {
      message: `${data.username} joined the chat`,
      users: Array.from(roomUsers)
    });
  });

  socket.on('send_message', (data) => {
    const messages = messageHistory.get(data.room) || [];
    messages.push(data);
    if (messages.length > 50) messages.shift();
    messageHistory.set(data.room, messages);
    
    io.to(data.room).emit('receive_message', data);
  });

  socket.on('typing', (data) => {
    const { room, username, isTyping } = data;
    const typingSet = typingUsers.get(room);
    
    if (isTyping) {
      typingSet.add(username);
    } else {
      typingSet.delete(username);
    }
    
    socket.to(room).emit('typing_status', {
      users: Array.from(typingSet)
    });
  });

  socket.on('disconnect', () => {
    const userData = userSocketMap.get(socket.id);
    if (userData) {
      const { room, username, roomKey } = userData;
      const roomUsers = rooms.get(room);
      if (roomUsers) {
        roomUsers.delete(username);
        userEmailMap.delete(roomKey); // Clean up email mapping
        io.to(room).emit('user_left', {
          message: `${username} left the chat`,
          users: Array.from(roomUsers)
        });
      }
      userSocketMap.delete(socket.id);
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
