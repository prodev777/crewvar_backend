"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPortConnectionTables = void 0;
const database_1 = __importDefault(require("../config/database"));
const createPortConnectionTables = async () => {
    try {
        console.log('Creating port connection tables...');
        // Create port_connections table
        await database_1.default.execute(`
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
    }
    catch (error) {
        console.error('Error creating port connection tables:', error);
        throw error;
    }
};
exports.createPortConnectionTables = createPortConnectionTables;
// Run if called directly
if (require.main === module) {
    (0, exports.createPortConnectionTables)()
        .then(() => {
        console.log('Port connection tables setup complete');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Failed to create port connection tables:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=createPortConnectionTables.js.map