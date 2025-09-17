"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.testConnection = exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crewvar',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    // Increase packet size to handle large base64 image data
    max_allowed_packet: 64 * 1024 * 1024, // 64MB
    // Additional MySQL settings for large data
    multipleStatements: true,
    supportBigNumbers: true,
    bigNumberStrings: true
};
// Create connection pool
exports.pool = promise_1.default.createPool(dbConfig);
// Test database connection
const testConnection = async () => {
    try {
        const connection = await exports.pool.getConnection();
        console.log('✅ Database connected successfully');
        // Increase max_allowed_packet for this session
        try {
            await connection.execute('SET SESSION max_allowed_packet = 67108864'); // 64MB
            console.log('✅ MySQL packet size increased to 64MB');
        }
        catch (packetError) {
            console.log('⚠️ Could not increase packet size (this is usually fine)');
        }
        connection.release();
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};
exports.testConnection = testConnection;
// Initialize database and tables
const initializeDatabase = async () => {
    try {
        // Create database if it doesn't exist
        const connection = await promise_1.default.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password
        });
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        await connection.end();
        console.log('✅ Database initialized successfully');
    }
    catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
exports.default = exports.pool;
//# sourceMappingURL=database.js.map