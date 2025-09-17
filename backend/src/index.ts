import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import configurations
import { testConnection, initializeDatabase, pool } from './config/database';
import { createTables, seedInitialData } from './config/schema';
import { migrateUsersTable } from './config/migration';
import { migrateCruiseData } from './scripts/cruiseDataMigration';
import { createPortLinkingTables } from './config/portLinkingSchema';
import { createConnectionTables } from './config/connectionTables';
import { createChatTables } from './config/chatTables';
import { addProfileColumns } from './scripts/addProfileColumns';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import shipRoutes from './routes/ships';
import cruiseDataRoutes from './routes/cruiseData';
import portLinkingRoutes from './routes/portLinking';
import crewRoutes from './routes/crew';
import connectionRoutes from './routes/connections';
import chatRoutes from './routes/chat';
import moderationRoutes from './routes/moderation';
import calendarRoutes from './routes/calendar';
import notificationRoutes from './routes/notifications';
import uploadRoutes from './routes/upload';
import favoritesRoutes from './routes/favorites';

// Load environment variables
dotenv.config();

// Temporary hardcoded values for testing (remove in production)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_NAME = process.env.DB_NAME || 'crewvar';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '3000';

console.log('🔧 Environment variables loaded:');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');
console.log('- DB_HOST:', process.env.DB_HOST || '❌ Not set');
console.log('- DB_NAME:', process.env.DB_NAME || '❌ Not set');
console.log('- NODE_ENV:', process.env.NODE_ENV || '❌ Not set');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting (disabled for development)
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || "http://localhost:5173");
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ships', shipRoutes);
app.use('/api/cruise-data', cruiseDataRoutes);
app.use('/api/port-linking', portLinkingRoutes);
app.use('/api/crew', crewRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/favorites', favoritesRoutes);

// Socket.IO for real-time features
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    socket.data.userId = decoded.userId;
    socket.data.userName = decoded.displayName;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  const userName = socket.data.userName;
  
  console.log(`User connected: ${userName} (${userId})`);

  // Join user's personal room
  socket.on('join_user_room', (userId) => {
    socket.join(`user-${userId}`);
    socket.broadcast.emit('user_online', userId);
    console.log(`User ${userName} joined their room`);
  });

  // Join chat room
  socket.on('join_room', (roomId) => {
    socket.join(`room-${roomId}`);
    console.log(`User ${userName} joined room ${roomId}`);
  });

  // Leave chat room
  socket.on('leave_room', (roomId) => {
    socket.leave(`room-${roomId}`);
    console.log(`User ${userName} left room ${roomId}`);
  });

  // Send message
  socket.on('send_message', async (data) => {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message = {
      id: messageId,
      roomId: data.roomId,
      userId: userId,
      userName: userName,
      message: data.message,
      timestamp: data.timestamp || new Date().toISOString()
    };

    // Broadcast to all users in the room
    io.to(`room-${data.roomId}`).emit('new_message', message);
    
    // Save message to database (optional)
    try {
      await pool.execute(
        `INSERT INTO messages (id, room_id, user_id, message, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [messageId, data.roomId, userId, data.message]
      );
    } catch (error) {
      console.error('Error saving message:', error);
    }

    console.log(`Message sent by ${userName} in room ${data.roomId}`);
  });

  // Typing indicators
  socket.on('start_typing', (data) => {
    socket.to(`room-${data.roomId}`).emit('user_typing', {
      roomId: data.roomId,
      userId: userId,
      userName: userName
    });
  });

  socket.on('stop_typing', (data) => {
    socket.to(`room-${data.roomId}`).emit('user_stopped_typing', {
      roomId: data.roomId,
      userId: userId
    });
  });

  // User status updates
  socket.on('update_status', (data) => {
    socket.broadcast.emit('user_status_update', {
      userId: userId,
      status: data.status
    });
  });

  // Get online users
  socket.on('get_online_users', () => {
    const rooms = Array.from(socket.rooms);
    const userRooms = rooms.filter(room => room.startsWith('user-'));
    const onlineUserIds = userRooms.map(room => room.replace('user-', ''));
    socket.emit('online_users', onlineUserIds);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userName} (${userId})`);
    socket.broadcast.emit('user_offline', userId);
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Initialize database and create tables
    await initializeDatabase();
    await createTables();
    await migrateUsersTable(); // Run migration for existing users table
    await addProfileColumns(); // Add profile columns (bio, contacts, social media)
    await migrateCruiseData(); // Run cruise data migration
    await createPortLinkingTables(); // Create port linking tables
    await createConnectionTables(); // Create connection system tables
    await createChatTables(); // Create chat system tables
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚢 Crewvar Backend Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📡 Socket.IO server ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };
