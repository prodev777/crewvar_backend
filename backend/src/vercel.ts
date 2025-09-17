import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

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
import feedbackRoutes from './routes/feedback';

// Load environment variables
dotenv.config();

console.log('🚀 Starting Crewvar Backend API (Vercel)...');
console.log('📊 Environment Configuration:');
console.log('- NODE_ENV:', process.env.NODE_ENV || '❌ Not set');
console.log('- DB_HOST:', process.env.DB_HOST || '❌ Not set');
console.log('- DB_NAME:', process.env.DB_NAME || '❌ Not set');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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
app.use('/api/feedback', feedbackRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Crewvar Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      ships: '/api/ships',
      crew: '/api/crew',
      connections: '/api/connections',
      chat: '/api/chat',
      calendar: '/api/calendar'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Initialize database connection (only once per serverless function instance)
let isInitialized = false;

const initializeApp = async () => {
  if (isInitialized) return;
  
  try {
    console.log('🔌 Testing database connection...');
    await testConnection();
    console.log('✅ Database connection successful');
    
    console.log('📋 Initializing database schema...');
    await createTables();
    await createPortLinkingTables();
    await createConnectionTables();
    await createChatTables();
    console.log('✅ Database schema initialized');
    
    console.log('🌱 Seeding initial data...');
    await seedInitialData();
    await migrateUsersTable();
    await migrateCruiseData();
    await addProfileColumns();
    console.log('✅ Initial data seeded');
    
    isInitialized = true;
    console.log('🎉 Backend API ready!');
  } catch (error) {
    console.error('❌ Failed to initialize:', error);
    // Don't exit process in serverless environment
  }
};

// Initialize the app
initializeApp();

// Export for Vercel
export default app;
