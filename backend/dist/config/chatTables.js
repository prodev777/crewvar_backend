"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatTables = void 0;
const database_1 = __importDefault(require("../config/database"));
const createChatTables = async () => {
    try {
        console.log('💬 Creating chat tables...');
        // Chat rooms table
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id VARCHAR(36) PRIMARY KEY,
        participant1_id VARCHAR(36) NOT NULL,
        participant2_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_participants (participant1_id, participant2_id)
      )
    `);
        // Chat messages table
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(36) PRIMARY KEY,
        room_id VARCHAR(36) NOT NULL,
        sender_id VARCHAR(36) NOT NULL,
        receiver_id VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        message_type ENUM('text', 'image', 'file') DEFAULT 'text',
        status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_room_id (room_id),
        INDEX idx_sender_id (sender_id),
        INDEX idx_receiver_id (receiver_id),
        INDEX idx_created_at (created_at)
      )
    `);
        // User online status table
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS user_online_status (
        user_id VARCHAR(36) PRIMARY KEY,
        is_online BOOLEAN DEFAULT FALSE,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        console.log('✅ Chat tables created successfully');
    }
    catch (error) {
        console.error('❌ Error creating chat tables:', error);
        throw error;
    }
};
exports.createChatTables = createChatTables;
//# sourceMappingURL=chatTables.js.map