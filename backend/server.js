import './env.js'; // Must be first — loads .env before any service singleton is constructed
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import childRoutes from './routes/childRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import chatService from './services/chat.service.js';
import { verifyEmailConfig } from './config/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
};

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
});
app.set('io', io);

// Socket.IO JWT authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error: no token provided'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = (decoded.id || decoded._id)?.toString();
    next();
  } catch {
    next(new Error('Authentication error: invalid token'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  // Each user joins a room named by their userId so they can be targeted directly
  socket.join(socket.userId);

  socket.on('send_message', async (data) => {
    const { receiverId, content, type, fileUrl, fileName } = data;
    try {
      const message = await chatService.saveMessage({
        senderId: socket.userId,
        receiverId,
        content: content || '',
        type: type || 'text',
        fileUrl,
        fileName,
      });
      // Deliver to recipient
      io.to(receiverId.toString()).emit('receive_message', message);
      // Confirm to sender
      socket.emit('message_sent', message);
    } catch (err) {
      socket.emit('message_error', { error: err.message });
    }
  });

  socket.on('typing', ({ receiverId }) => {
    socket.to(receiverId.toString()).emit('user_typing', { senderId: socket.userId });
  });

  socket.on('stop_typing', ({ receiverId }) => {
    socket.to(receiverId.toString()).emit('user_stop_typing', { senderId: socket.userId });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] disconnected: ${socket.userId}`);
  });
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded chat files statically
app.use('/uploads/chat', express.static(path.join(__dirname, 'uploads', 'chat')));

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGO_URI ? 'Set' : 'Not Set');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Verify email configuration (non-blocking)
    console.log('Verifying email config in background...');
    verifyEmailConfig().then(() => {
      console.log('Email config verification completed');
    }).catch((err) => {
      console.warn('Email config verification failed:', err.message);
    });
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('Full error:', error);
    console.error('Stack trace:', error.stack);
    console.error('Please check:');
    console.error('1. Your internet connection');
    console.error('2. MongoDB Atlas IP whitelist (add 0.0.0.0/0 for all IPs)');
    console.error('3. MongoDB credentials in .env file');
    console.error('MONGO_URI:', process.env.MONGO_URI);
    // Don't exit immediately, let the server run for debugging
    console.error('⚠️ Server will continue running without database connection for debugging...');
  }
};

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/caregiver', childRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/chat', chatRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  console.error('Server will continue running...');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('Server will continue running...');
});

export default app;
