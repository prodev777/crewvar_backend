"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnectionTables = void 0;
const database_1 = require("./database");
const createConnectionTables = async () => {
    try {
        console.log('Creating connection system tables...');
        // Create connection_requests table
        await database_1.pool.execute(`
            CREATE TABLE IF NOT EXISTS connection_requests (
                id VARCHAR(36) PRIMARY KEY,
                requester_id VARCHAR(36) NOT NULL,
                receiver_id VARCHAR(36) NOT NULL,
                status ENUM('pending', 'accepted', 'declined', 'blocked') DEFAULT 'pending',
                request_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Ensure users can't send multiple requests to the same person
                UNIQUE KEY unique_request (requester_id, receiver_id),
                
                -- Foreign key constraints
                FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
                
                -- Indexes for performance
                INDEX idx_requester (requester_id),
                INDEX idx_receiver (receiver_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            )
        `);
        // Create connections table (for accepted connections)
        await database_1.pool.execute(`
            CREATE TABLE IF NOT EXISTS connections (
                id VARCHAR(36) PRIMARY KEY,
                user1_id VARCHAR(36) NOT NULL,
                user2_id VARCHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Ensure users can't be connected multiple times
                UNIQUE KEY unique_connection (user1_id, user2_id),
                
                -- Foreign key constraints
                FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
                
                -- Indexes for performance
                INDEX idx_user1 (user1_id),
                INDEX idx_user2 (user2_id),
                INDEX idx_created_at (created_at)
            )
        `);
        // Create user_blocks table
        await database_1.pool.execute(`
            CREATE TABLE IF NOT EXISTS user_blocks (
                id INT PRIMARY KEY AUTO_INCREMENT,
                blocker_id VARCHAR(36) NOT NULL,
                blocked_id VARCHAR(36) NOT NULL,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Ensure users can't block the same person multiple times
                UNIQUE KEY unique_block (blocker_id, blocked_id),
                
                -- Foreign key constraints
                FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
                
                -- Indexes for performance
                INDEX idx_blocker (blocker_id),
                INDEX idx_blocked (blocked_id)
            )
        `);
        // Create connection_activity table
        await database_1.pool.execute(`
            CREATE TABLE IF NOT EXISTS connection_activity (
                id INT PRIMARY KEY AUTO_INCREMENT,
                connection_id INT NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                action ENUM('sent', 'received', 'accepted', 'declined', 'blocked', 'unblocked') NOT NULL,
                details JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Foreign key constraints
                FOREIGN KEY (connection_id) REFERENCES connection_requests(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                
                -- Indexes for performance
                INDEX idx_connection (connection_id),
                INDEX idx_user (user_id),
                INDEX idx_action (action),
                INDEX idx_created_at (created_at)
            )
        `);
        console.log('✅ Connection system tables created successfully!');
        return true;
    }
    catch (error) {
        console.error('❌ Error creating connection tables:', error);
        return false;
    }
};
exports.createConnectionTables = createConnectionTables;
//# sourceMappingURL=connectionTables.js.map