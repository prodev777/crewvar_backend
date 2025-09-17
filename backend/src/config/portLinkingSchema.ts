import pool from '../config/database';

export const createPortLinkingTables = async (): Promise<void> => {
  try {
    console.log('🔄 Creating port linking tables...');
    
    // Port linking table - tracks when ships are docked together
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS port_linkings (
        id VARCHAR(36) PRIMARY KEY,
        ship1_id VARCHAR(36) NOT NULL,
        ship2_id VARCHAR(36) NOT NULL,
        port_name VARCHAR(255),
        linking_date DATE NOT NULL,
        created_by VARCHAR(36) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ship1_id) REFERENCES ships(id) ON DELETE CASCADE,
        FOREIGN KEY (ship2_id) REFERENCES ships(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_linking (ship1_id, ship2_id, linking_date),
        INDEX idx_linking_date (linking_date),
        INDEX idx_ship1 (ship1_id),
        INDEX idx_ship2 (ship2_id)
      )
    `);

    // Port status table - tracks user's current port status
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_port_status (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        ship_id VARCHAR(36) NOT NULL,
        port_name VARCHAR(255),
        status ENUM('docked', 'at_sea', 'in_transit') DEFAULT 'docked',
        linked_ships JSON,
        status_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_date (user_id, status_date),
        INDEX idx_user_id (user_id),
        INDEX idx_ship_id (ship_id),
        INDEX idx_status_date (status_date)
      )
    `);

    console.log('✅ Port linking tables created successfully');
  } catch (error) {
    console.error('❌ Error creating port linking tables:', error);
    throw error;
  }
};
