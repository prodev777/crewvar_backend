"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
async function checkAndRecreateChatTables() {
    try {
        console.log('🔍 Checking chat tables...');
        // Check if chat_messages table exists and its structure
        const [tables] = await database_1.default.execute("SHOW TABLES LIKE 'chat_messages'");
        console.log('Chat messages table exists:', tables.length > 0);
        if (tables.length > 0) {
            const [columns] = await database_1.default.execute("DESCRIBE chat_messages");
            console.log('Chat messages columns:', columns);
        }
        // Check if chat_rooms table exists
        const [roomsTable] = await database_1.default.execute("SHOW TABLES LIKE 'chat_rooms'");
        console.log('Chat rooms table exists:', roomsTable.length > 0);
        if (roomsTable.length > 0) {
            const [roomsColumns] = await database_1.default.execute("DESCRIBE chat_rooms");
            console.log('Chat rooms columns:', roomsColumns);
        }
        // Drop existing tables if they have wrong structure
        console.log('🗑️ Dropping existing chat tables...');
        await database_1.default.execute("DROP TABLE IF EXISTS chat_messages");
        await database_1.default.execute("DROP TABLE IF EXISTS chat_rooms");
        await database_1.default.execute("DROP TABLE IF EXISTS user_online_status");
        // Recreate tables with correct structure
        console.log('🔄 Recreating chat tables...');
        // Chat rooms table
        await database_1.default.execute(`
      CREATE TABLE chat_rooms (
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
      CREATE TABLE chat_messages (
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
      CREATE TABLE user_online_status (
        user_id VARCHAR(36) PRIMARY KEY,
        is_online BOOLEAN DEFAULT FALSE,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        console.log('✅ Chat tables recreated successfully');
        // Verify the structure
        const [newColumns] = await database_1.default.execute("DESCRIBE chat_messages");
        console.log('New chat messages columns:', newColumns);
    }
    catch (error) {
        console.error('❌ Error checking/recreating chat tables:', error);
    }
    finally {
        await database_1.default.end();
        process.exit(0);
    }
}
checkAndRecreateChatTables();
//# sourceMappingURL=fixChatTables.js.map