import pool from '../config/database';

export const createCalendarTables = async () => {
  try {
    console.log('Creating calendar tables...');

    // Create cruise_assignments table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS cruise_assignments (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        cruise_line_id VARCHAR(36) NOT NULL,
        ship_id VARCHAR(36) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status ENUM('upcoming', 'current', 'completed', 'cancelled') DEFAULT 'upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (cruise_line_id) REFERENCES cruise_lines(id) ON DELETE CASCADE,
        FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE
      )
    `);

    // Create calendar_events table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        event_type ENUM('assignment', 'port', 'personal') NOT NULL,
        assignment_id VARCHAR(36) NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#069B93',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assignment_id) REFERENCES cruise_assignments(id) ON DELETE SET NULL
      )
    `);

    // Create index for better performance
    await pool.execute(`
      CREATE INDEX IF NOT EXISTS idx_cruise_assignments_user_dates 
      ON cruise_assignments(user_id, start_date, end_date)
    `);

    await pool.execute(`
      CREATE INDEX IF NOT EXISTS idx_calendar_events_user_dates 
      ON calendar_events(user_id, start_date, end_date)
    `);

    console.log('Calendar tables created successfully!');
  } catch (error) {
    console.error('Error creating calendar tables:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createCalendarTables()
    .then(() => {
      console.log('Calendar tables setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create calendar tables:', error);
      process.exit(1);
    });
}
