"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedInitialData = exports.createTables = void 0;
const database_1 = __importDefault(require("./database"));
const createTables = async () => {
    try {
        // Users table
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        profile_photo LONGTEXT,
        bio TEXT,
        phone VARCHAR(20),
        instagram VARCHAR(255),
        twitter VARCHAR(255),
        facebook VARCHAR(255),
        snapchat VARCHAR(255),
        website VARCHAR(255),
        additional_photo_1 LONGTEXT,
        additional_photo_2 LONGTEXT,
        additional_photo_3 LONGTEXT,
        department_id VARCHAR(50),
        subcategory_id VARCHAR(50),
        role_id VARCHAR(50),
        current_ship_id VARCHAR(50),
        is_email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        verification_token_expires DATETIME,
        password_reset_token VARCHAR(255),
        password_reset_expires DATETIME,
        is_active BOOLEAN DEFAULT TRUE,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        // Departments table
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        // Subcategories table
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        department_id VARCHAR(36),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      )
    `);
        // Roles table
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        department_id VARCHAR(36),
        subcategory_id VARCHAR(36),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
      )
    `);
        // Cruise Lines table
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS cruise_lines (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company_code VARCHAR(50),
        headquarters VARCHAR(255),
        founded_year INTEGER,
        fleet_size INTEGER,
        website VARCHAR(255),
        logo_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        // Ships table
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS ships (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cruise_line_id VARCHAR(36) NOT NULL,
        ship_code VARCHAR(50),
        capacity INTEGER,
        length_meters DECIMAL(10,2),
        width_meters DECIMAL(10,2),
        gross_tonnage INTEGER,
        year_built INTEGER,
        refurbished_year INTEGER,
        home_port VARCHAR(255),
        ship_type VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (cruise_line_id) REFERENCES cruise_lines(id) ON DELETE CASCADE
      )
    `);
        // Ports table
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS ports (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        country VARCHAR(100),
        city VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        // User assignments (current ship assignments)
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS user_assignments (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        ship_id VARCHAR(36) NOT NULL,
        port_id VARCHAR(36),
        start_date DATE NOT NULL,
        end_date DATE,
        is_current BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE,
        FOREIGN KEY (port_id) REFERENCES ports(id) ON DELETE SET NULL
      )
    `);
        // Connection requests
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
        // Connections (accepted connections)
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
        // Chat messages
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(36) PRIMARY KEY,
        sender_id VARCHAR(36) NOT NULL,
        receiver_id VARCHAR(36) NOT NULL,
        message TEXT NOT NULL,
        message_type ENUM('text', 'image', 'file') DEFAULT 'text',
        file_url VARCHAR(500),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        // Favorites
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS favorites (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        favorite_user_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (favorite_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_favorite (user_id, favorite_user_id)
      )
    `);
        // Reports
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(36) PRIMARY KEY,
        reporter_id VARCHAR(36) NOT NULL,
        reported_user_id VARCHAR(36) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        // User photos
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS user_photos (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        photo_url VARCHAR(500) NOT NULL,
        is_profile_photo BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        // Notifications
        await database_1.default.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        console.log('✅ All tables created successfully');
    }
    catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    }
};
exports.createTables = createTables;
const seedInitialData = async () => {
    try {
        // Insert sample departments
        await database_1.default.execute(`
      INSERT IGNORE INTO departments (id, name, description) VALUES
      ('dept-1', 'Entertainment', 'Guest entertainment and activities'),
      ('dept-2', 'Food & Beverage', 'Dining and beverage services'),
      ('dept-3', 'Housekeeping', 'Cabin and public area maintenance'),
      ('dept-4', 'Deck', 'Ship operations and maintenance'),
      ('dept-5', 'Engineering', 'Technical systems and maintenance'),
      ('dept-6', 'Security', 'Safety and security services'),
      ('dept-7', 'Medical', 'Health and medical services'),
      ('dept-8', 'Guest Services', 'Guest relations and support')
    `);
        // Insert sample subcategories
        await database_1.default.execute(`
      INSERT IGNORE INTO subcategories (id, name, department_id, description) VALUES
      ('sub-1', 'Cruise Director', 'dept-1', 'Overall entertainment management'),
      ('sub-2', 'Activities Coordinator', 'dept-1', 'Guest activities and programs'),
      ('sub-3', 'Musician', 'dept-1', 'Live music and performances'),
      ('sub-4', 'Head Waiter', 'dept-2', 'Dining room supervision'),
      ('sub-5', 'Bartender', 'dept-2', 'Beverage service'),
      ('sub-6', 'Cabin Steward', 'dept-3', 'Cabin cleaning and maintenance'),
      ('sub-7', 'Deck Officer', 'dept-4', 'Ship navigation and operations'),
      ('sub-8', 'Engineer', 'dept-5', 'Technical system maintenance')
    `);
        // Insert sample roles
        await database_1.default.execute(`
      INSERT IGNORE INTO roles (id, name, department_id, subcategory_id, description) VALUES
      ('role-1', 'Cruise Director', 'dept-1', 'sub-1', 'Lead entertainment coordinator'),
      ('role-2', 'Activities Coordinator', 'dept-1', 'sub-2', 'Guest activities management'),
      ('role-3', 'Pianist', 'dept-1', 'sub-3', 'Live piano performances'),
      ('role-4', 'Head Waiter', 'dept-2', 'sub-4', 'Dining room team leader'),
      ('role-5', 'Senior Bartender', 'dept-2', 'sub-5', 'Beverage service supervisor'),
      ('role-6', 'Cabin Steward', 'dept-3', 'sub-6', 'Guest cabin maintenance'),
      ('role-7', 'First Officer', 'dept-4', 'sub-7', 'Senior deck operations'),
      ('role-8', 'Chief Engineer', 'dept-5', 'sub-8', 'Technical systems lead')
    `);
        // Insert sample cruise lines
        await database_1.default.execute(`
      INSERT IGNORE INTO cruise_lines (id, name, company_code, headquarters, founded_year, fleet_size) VALUES
      ('cl-1', 'Royal Caribbean International', 'RCI', 'Miami, Florida', 1968, 26),
      ('cl-2', 'Carnival Cruise Line', 'CCL', 'Miami, Florida', 1972, 24),
      ('cl-3', 'Norwegian Cruise Line', 'NCL', 'Miami, Florida', 1966, 18),
      ('cl-4', 'MSC Cruises', 'MSC', 'Geneva, Switzerland', 1987, 19),
      ('cl-5', 'Princess Cruises', 'PRINCESS', 'Santa Clarita, California', 1965, 15)
    `);
        // Insert sample ships
        await database_1.default.execute(`
      INSERT IGNORE INTO ships (id, name, cruise_line_id, ship_code, capacity, year_built, home_port) VALUES
      ('ship-1', 'Harmony of the Seas', 'cl-1', 'HARMONY', 5479, 2016, 'Port Canaveral'),
      ('ship-2', 'Symphony of the Seas', 'cl-1', 'SYMPHONY', 5518, 2018, 'Miami'),
      ('ship-3', 'Carnival Mardi Gras', 'cl-2', 'MARDI', 5208, 2021, 'Port Canaveral'),
      ('ship-4', 'Norwegian Encore', 'cl-3', 'ENCORE', 3998, 2019, 'Seattle'),
      ('ship-5', 'MSC Grandiosa', 'cl-4', 'GRANDIOSA', 4938, 2019, 'Barcelona')
    `);
        // Insert sample ports
        await database_1.default.execute(`
      INSERT IGNORE INTO ports (id, name, country, city) VALUES
      ('port-1', 'Miami, FL', 'United States', 'Miami'),
      ('port-2', 'Port Canaveral, FL', 'United States', 'Port Canaveral'),
      ('port-3', 'Seattle, WA', 'United States', 'Seattle'),
      ('port-4', 'Barcelona, Spain', 'Spain', 'Barcelona'),
      ('port-5', 'Dubai, UAE', 'United Arab Emirates', 'Dubai')
    `);
        console.log('✅ Initial data seeded successfully');
    }
    catch (error) {
        console.error('❌ Error seeding initial data:', error);
        throw error;
    }
};
exports.seedInitialData = seedInitialData;
//# sourceMappingURL=schema.js.map