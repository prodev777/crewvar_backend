import pool from '../config/database';

export const createModerationTables = async () => {
  try {
    console.log('Creating moderation tables...');

    // Create reports table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        reporter_id VARCHAR(36) NOT NULL,
        reported_user_id VARCHAR(36) NOT NULL,
        report_type ENUM('spam', 'harassment', 'inappropriate_content', 'fake_profile', 'other') NOT NULL,
        description TEXT NOT NULL,
        status ENUM('pending', 'investigating', 'resolved', 'dismissed') DEFAULT 'pending',
        resolution TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create moderation_actions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS moderation_actions (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        report_id VARCHAR(36),
        moderator_id VARCHAR(36) NOT NULL,
        target_user_id VARCHAR(36) NOT NULL,
        action_type ENUM('warning', 'temporary_ban', 'permanent_ban') NOT NULL,
        reason TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL,
        FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add ban-related columns to users table if they don't exist
    await pool.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMP NULL
    `);

    console.log('Moderation tables created successfully!');
  } catch (error) {
    console.error('Error creating moderation tables:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createModerationTables()
    .then(() => {
      console.log('Moderation tables setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create moderation tables:', error);
      process.exit(1);
    });
}
