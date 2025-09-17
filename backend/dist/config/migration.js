"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateUsersTable = void 0;
const database_1 = __importDefault(require("./database"));
const migrateUsersTable = async () => {
    try {
        console.log('🔄 Migrating users table...');
        // Add new columns if they don't exist
        const columnsToAdd = [
            { name: 'profile_photo', type: 'VARCHAR(500)' },
            { name: 'department_id', type: 'VARCHAR(50)' },
            { name: 'subcategory_id', type: 'VARCHAR(50)' },
            { name: 'role_id', type: 'VARCHAR(50)' },
            { name: 'current_ship_id', type: 'VARCHAR(50)' }
        ];
        for (const column of columnsToAdd) {
            try {
                await database_1.default.execute(`
          ALTER TABLE users 
          ADD COLUMN ${column.name} ${column.type}
        `);
                console.log(`✅ Added column: ${column.name}`);
            }
            catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ Column ${column.name} already exists`);
                }
                else {
                    console.error(`❌ Error adding column ${column.name}:`, error.message);
                }
            }
        }
        // Remove old columns if they exist
        const columnsToRemove = ['avatar_url', 'department', 'subcategory', 'role'];
        for (const column of columnsToRemove) {
            try {
                await database_1.default.execute(`
          ALTER TABLE users 
          DROP COLUMN ${column}
        `);
                console.log(`✅ Removed old column: ${column}`);
            }
            catch (error) {
                if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                    console.log(`ℹ️ Column ${column} doesn't exist or can't be dropped`);
                }
                else {
                    console.error(`❌ Error removing column ${column}:`, error.message);
                }
            }
        }
        console.log('✅ Users table migration completed');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
};
exports.migrateUsersTable = migrateUsersTable;
//# sourceMappingURL=migration.js.map