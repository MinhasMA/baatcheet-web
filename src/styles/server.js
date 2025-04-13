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
const userSocketMap = new Map(); // Track which socket belongs to which user

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (data) => {
    const { room, username, userId } = data;
    socket.join(room);
    
    // Initialize room if doesn't exist
    if (!rooms.has(room)) {
      rooms.set(room, new Set());
      messageHistory.set(room, []);
      typingUsers.set(room, new Set());
    }
    
    // Store user information
    userSocketMap.set(socket.id, { room, username, userId });
    rooms.get(room).add(username);
    
    // Send message history
    socket.emit('message_history', messageHistory.get(room));
    
    // Broadcast user joined
    io.to(room).emit('user_joined', {
      message: `${username} joined the chat`,
      users: Array.from(rooms.get(room))
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
      const { room, username } = userData;
      const roomUsers = rooms.get(room);
      if (roomUsers) {
        roomUsers.delete(username);
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
