"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateCruiseLinesTable = exports.migrateShipsTable = void 0;
const database_1 = __importDefault(require("../config/database"));
const migrateShipsTable = async () => {
    try {
        console.log('🔄 Migrating ships table...');
        // First, check if cruise_line_id column exists
        const [columns] = await database_1.default.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'ships' 
      AND COLUMN_NAME = 'cruise_line_id'
    `);
        if (Array.isArray(columns) && columns.length === 0) {
            console.log('📝 Adding cruise_line_id column to ships table...');
            // Add cruise_line_id column
            await database_1.default.execute(`
        ALTER TABLE ships 
        ADD COLUMN cruise_line_id VARCHAR(36) AFTER name
      `);
            // Add other new columns
            await database_1.default.execute(`
        ALTER TABLE ships 
        ADD COLUMN ship_code VARCHAR(50) AFTER cruise_line_id,
        ADD COLUMN length_meters DECIMAL(10,2) AFTER ship_code,
        ADD COLUMN width_meters DECIMAL(10,2) AFTER length_meters,
        ADD COLUMN gross_tonnage INTEGER AFTER width_meters,
        ADD COLUMN year_built INTEGER AFTER gross_tonnage,
        ADD COLUMN refurbished_year INTEGER AFTER year_built,
        ADD COLUMN home_port VARCHAR(255) AFTER refurbished_year,
        ADD COLUMN ship_type VARCHAR(100) AFTER home_port
      `);
            console.log('✅ Ships table migrated successfully');
        }
        else {
            console.log('✅ Ships table already migrated');
        }
    }
    catch (error) {
        console.error('❌ Error migrating ships table:', error);
        throw error;
    }
};
exports.migrateShipsTable = migrateShipsTable;
const migrateCruiseLinesTable = async () => {
    try {
        console.log('🔄 Checking cruise_lines table...');
        // Check if cruise_lines table exists
        const [tables] = await database_1.default.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'cruise_lines'
    `);
        if (Array.isArray(tables) && tables.length === 0) {
            console.log('📝 Creating cruise_lines table...');
            await database_1.default.execute(`
        CREATE TABLE cruise_lines (
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
            console.log('✅ Cruise_lines table created successfully');
        }
        else {
            console.log('✅ Cruise_lines table already exists');
        }
    }
    catch (error) {
        console.error('❌ Error creating cruise_lines table:', error);
        throw error;
    }
};
exports.migrateCruiseLinesTable = migrateCruiseLinesTable;
//# sourceMappingURL=cruiseMigration.js.map