"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
async function restoreSampleData() {
    try {
        console.log('🔄 Restoring sample data...');
        // Insert sample departments
        console.log('📋 Adding departments...');
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
        console.log('📋 Adding subcategories...');
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
        console.log('📋 Adding roles...');
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
        console.log('🚢 Adding cruise lines...');
        await database_1.default.execute(`
            INSERT IGNORE INTO cruise_lines (id, name, company_code, headquarters, founded_year, fleet_size) VALUES
            ('cl-1', 'Royal Caribbean International', 'RCI', 'Miami, Florida', 1968, 26),
            ('cl-2', 'Carnival Cruise Line', 'CCL', 'Miami, Florida', 1972, 24),
            ('cl-3', 'Norwegian Cruise Line', 'NCL', 'Miami, Florida', 1966, 18),
            ('cl-4', 'MSC Cruises', 'MSC', 'Geneva, Switzerland', 1987, 19),
            ('cl-5', 'Princess Cruises', 'PRINCESS', 'Santa Clarita, California', 1965, 15)
        `);
        // Insert sample ships
        console.log('🚢 Adding ships...');
        await database_1.default.execute(`
            INSERT IGNORE INTO ships (id, name, cruise_line_id, ship_code, capacity, year_built, home_port) VALUES
            ('ship-1', 'Harmony of the Seas', 'cl-1', 'HARMONY', 5479, 2016, 'Port Canaveral'),
            ('ship-2', 'Symphony of the Seas', 'cl-1', 'SYMPHONY', 5518, 2018, 'Miami'),
            ('ship-3', 'Carnival Mardi Gras', 'cl-2', 'MARDI', 5208, 2021, 'Port Canaveral'),
            ('ship-4', 'Norwegian Encore', 'cl-3', 'ENCORE', 3998, 2019, 'Seattle'),
            ('ship-5', 'MSC Grandiosa', 'cl-4', 'GRANDIOSA', 4938, 2019, 'Barcelona')
        `);
        console.log('✅ Sample data restored successfully!');
        console.log('📊 Cruise lines, ships, departments, and roles are now available for testing.');
    }
    catch (error) {
        console.error('❌ Error restoring sample data:', error);
    }
    finally {
        // Close the connection
        await database_1.default.end();
        process.exit(0);
    }
}
restoreSampleData();
//# sourceMappingURL=restoreSampleData.js.map