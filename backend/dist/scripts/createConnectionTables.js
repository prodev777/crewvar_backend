"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnectionTables = void 0;
const database_1 = __importDefault(require("../config/database"));
const createConnectionTables = async () => {
    try {
        console.log('🔗 Creating connection tables...');
        // Create connection_requests table
        await database_1.default.execute(`
            CREATE TABLE IF NOT EXISTS connection_requests (
                id VARCHAR(36) PRIMARY KEY,
                requester_id VARCHAR(36) NOT NULL,
                receiver_id VARCHAR(36) NOT NULL,
                status ENUM('pending', 'accepted', 'declined', 'blocked') DEFAULT 'pending',
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_request (requester_id, receiver_id)
            )
        `);
        // Create connections table
        await database_1.default.execute(`
            CREATE TABLE IF NOT EXISTS connections (
                id VARCHAR(36) PRIMARY KEY,
                user1_id VARCHAR(36) NOT NULL,
                user2_id VARCHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_connection (user1_id, user2_id)
            )
        `);
        console.log('✅ Connection tables created successfully');
    }
    catch (error) {
        console.error('❌ Error creating connection tables:', error?.message, error?.stack);
        throw error;
    }
};
exports.createConnectionTables = createConnectionTables;
//# sourceMappingURL=createConnectionTables.js.map