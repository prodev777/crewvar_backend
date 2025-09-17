"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
// Import configurations
const database_1 = require("./config/database");
const schema_1 = require("./config/schema");
const migration_1 = require("./config/migration");
const cruiseDataMigration_1 = require("./scripts/cruiseDataMigration");
const portLinkingSchema_1 = require("./config/portLinkingSchema");
const connectionTables_1 = require("./config/connectionTables");
const chatTables_1 = require("./config/chatTables");
const addProfileColumns_1 = require("./scripts/addProfileColumns");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const ships_1 = __importDefault(require("./routes/ships"));
const cruiseData_1 = __importDefault(require("./routes/cruiseData"));
const portLinking_1 = __importDefault(require("./routes/portLinking"));
const crew_1 = __importDefault(require("./routes/crew"));
const connections_1 = __importDefault(require("./routes/connections"));
const chat_1 = __importDefault(require("./routes/chat"));
const moderation_1 = __importDefault(require("./routes/moderation"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const upload_1 = __importDefault(require("./routes/upload"));
const favorites_1 = __importDefault(require("./routes/favorites"));
// Load environment variables
dotenv_1.default.config();
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
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
const PORT = process.env.PORT || 3000;
// Security middleware
app.use((0, helmet_1.default)());
// Rate limiting (disabled for development)
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use(limiter);
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Static files with CORS headers
app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || "http://localhost:5173");
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
}, express_1.default.static('uploads'));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/ships', ships_1.default);
app.use('/api/cruise-data', cruiseData_1.default);
app.use('/api/port-linking', portLinking_1.default);
app.use('/api/crew', crew_1.default);
app.use('/api/connections', connections_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/moderation', moderation_1.default);
app.use('/api/calendar', calendar_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/favorites', favorites_1.default);
// Socket.IO for real-time features
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        // Verify JWT token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        socket.data.userId = decoded.userId;
        socket.data.userName = decoded.displayName;
        next();
    }
    catch (error) {
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
            await database_1.pool.execute(`INSERT INTO messages (id, room_id, user_id, message, created_at)
         VALUES (?, ?, ?, ?, NOW())`, [messageId, data.roomId, userId, data.message]);
        }
        catch (error) {
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
app.use((err, req, res, next) => {
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
        await (0, database_1.testConnection)();
        // Initialize database and create tables
        await (0, database_1.initializeDatabase)();
        await (0, schema_1.createTables)();
        await (0, migration_1.migrateUsersTable)(); // Run migration for existing users table
        await (0, addProfileColumns_1.addProfileColumns)(); // Add profile columns (bio, contacts, social media)
        await (0, cruiseDataMigration_1.migrateCruiseData)(); // Run cruise data migration
        await (0, portLinkingSchema_1.createPortLinkingTables)(); // Create port linking tables
        await (0, connectionTables_1.createConnectionTables)(); // Create connection system tables
        await (0, chatTables_1.createChatTables)(); // Create chat system tables
        // Start server
        server.listen(PORT, () => {
            console.log(`🚢 Crewvar Backend Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
            console.log(`📡 Socket.IO server ready`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map