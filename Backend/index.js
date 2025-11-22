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

const openaiRisksRoute = require('./Routes/gemini');
const conversationsRoute = require('./Routes/conversations');
const chatbotRoute = require('./Routes/chatbot'); // Import chatbot route
const geminiRoutes = require('./Routes/gemini'); // ✅ NEW: Import Gemini routes
const statsRoutes = require('./Routes/stats'); // Import stats routes

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
app.use('/api/stats', statsRoutes); // Use stats routes
app.use('/api/gemini', geminiRoutes); // ✅ NEW: Register Gemini routes
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

  // Listen for chat messages - REMOVED, handled in routes/conversations.js
  // socket.on('chatMessage', async ({ conversationId, message }) => { ... });

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
