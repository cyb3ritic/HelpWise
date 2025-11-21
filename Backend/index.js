// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cookie = require('cookie'); // Ensure 'cookie' is required

const openaiRisksRoute = require('./Routes/openaiRisks');
const conversationsRoute = require('./Routes/conversations');
const chatbotRoute = require('./Routes/chatbot'); // Import chatbot route

dotenv.config();

// Import Models
const Message = require('./models/Message'); // Ensure the Message model exists

// Initialize Express App
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true, // Allow credentials (cookies) to be sent
}));

app.use(helmet());

// Routes

// Middleware to attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/users', require('./Routes/users'));
app.use('/api/type-of-help', require('./Routes/typeOfHelp'));
app.use('/api/requests', require('./Routes/requests'));
app.use('/api/bids', require('./Routes/bids'));

app.use('/api/openai', require('./routes/openai'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/openai', openaiRisksRoute);
app.use('/api/conversations', conversationsRoute);
app.use('/api/chatbot', chatbotRoute);

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173', // Frontend URL
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      return next(new Error('Authentication error: No cookies found.'));
    }

    const parsedCookies = cookie.parse(cookies);
    const token = parsedCookies.token;

    if (!token) {
      return next(new Error('Authentication error: No token found.'));
    }

    // Verify token (assuming JWT)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded.user;
    next();
  } catch (err) {
    console.error('Socket.IO Authentication Error:', err.message);
    next(new Error('Authentication error.'));
  }
});

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id, 'User ID:', socket.user.id);

  // Join a room with the user's ID for private notifications
  socket.join(socket.user.id);

  // Join a room based on conversationId
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined room ${conversationId}`);
  });

  // Listen for chat messages
  socket.on('chatMessage', async ({ conversationId, message }) => {
    try {
      // Validate conversationId
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        socket.emit('errorMessage', { msg: 'Invalid Conversation ID.' });
        return;
      }

      // Find the conversation to ensure the user is a participant
      const Conversation = require('./models/Conversation'); // Ensure the model exists
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        socket.emit('errorMessage', { msg: 'Conversation not found.' });
        return;
      }

      if (!conversation.participants.includes(socket.user.id)) {
        socket.emit('errorMessage', { msg: 'Access denied: Not a participant of this conversation.' });
        return;
      }

      // Save the message to the database
      const newMessage = new Message({
        conversationId,
        sender: socket.user.id,
        content: message,
      });

      const savedMessage = await newMessage.save();

      // Populate sender details
      await savedMessage.populate('sender', 'firstName lastName email');

      // Emit the saved message to all participants in the room
      io.to(conversationId).emit('chatMessage', {
        _id: savedMessage._id,
        conversationId: savedMessage.conversationId,
        sender: savedMessage.sender,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
      });
    } catch (err) {
      console.error('Error handling chatMessage:', err.message);
      socket.emit('errorMessage', { msg: 'Failed to send message.' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Start Server
const PORT = process.env.PORT || 9001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
