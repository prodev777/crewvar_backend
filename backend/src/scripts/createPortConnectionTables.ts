import pool from '../config/database';

export const createPortConnectionTables = async () => {
  try {
    console.log('Creating port connection tables...');

    // Create port_connections table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS port_connections (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        ship_id_1 VARCHAR(36) NOT NULL,
        ship_id_2 VARCHAR(36) NOT NULL,
        port_name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME,
        status ENUM('active', 'ended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ship_id_1) REFERENCES ships(id) ON DELETE CASCADE,
        FOREIGN KEY (ship_id_2) REFERENCES ships(id) ON DELETE CASCADE
      )
    `);

    console.log('Port connection tables created successfully!');
  } catch (error) {
    console.error('Error creating port connection tables:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createPortConnectionTables()
    .then(() => {
      console.log('Port connection tables setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create port connection tables:', error);
      process.exit(1);
    });
}
