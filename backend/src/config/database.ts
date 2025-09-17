import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

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
export const pool = mysql.createPool(dbConfig);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    
    // Increase max_allowed_packet for this session
    try {
      await connection.execute('SET SESSION max_allowed_packet = 67108864'); // 64MB
      console.log('✅ MySQL packet size increased to 64MB');
    } catch (packetError) {
      console.log('⚠️ Could not increase packet size (this is usually fine)');
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Initialize database and tables
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Create database if it doesn't exist
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });

    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.end();

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

export default pool;
