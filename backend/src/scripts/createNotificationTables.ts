import pool from '../config/database';

export const createNotificationTables = async () => {
  try {
    console.log('Creating notification tables...');

    // Create notifications table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        type ENUM('connection_request', 'connection_accepted', 'message', 'system', 'assignment', 'port_connection', 'moderation') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSON NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create notification_preferences table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        type ENUM('connection_request', 'connection_accepted', 'message', 'system', 'assignment', 'port_connection', 'moderation') NOT NULL,
        email_enabled BOOLEAN DEFAULT TRUE,
        push_enabled BOOLEAN DEFAULT TRUE,
        in_app_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_type (user_id, type)
      )
    `);

    // Create indexes for better performance
    await pool.execute(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
      ON notifications(user_id, created_at DESC)
    `);

    await pool.execute(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
      ON notifications(user_id, is_read)
    `);

    await pool.execute(`
      CREATE INDEX IF NOT EXISTS idx_notifications_type 
      ON notifications(type)
    `);

    console.log('Notification tables created successfully!');
  } catch (error) {
    console.error('Error creating notification tables:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createNotificationTables()
    .then(() => {
      console.log('Notification tables setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create notification tables:', error);
      process.exit(1);
    });
}
