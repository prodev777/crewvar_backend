"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
async function cleanDatabase() {
    try {
        console.log('🧹 Starting database cleanup...');
        // Clear connection-related data first (due to foreign key constraints)
        console.log('🗑️ Clearing connection_requests...');
        await database_1.default.execute('DELETE FROM connection_requests');
        console.log('🗑️ Clearing connections...');
        await database_1.default.execute('DELETE FROM connections');
        // Clear user data
        console.log('🗑️ Clearing users...');
        await database_1.default.execute('DELETE FROM users');
        console.log('🗑️ Clearing departments...');
        await database_1.default.execute('DELETE FROM departments');
        console.log('🗑️ Clearing subcategories...');
        await database_1.default.execute('DELETE FROM subcategories');
        console.log('🗑️ Clearing roles...');
        await database_1.default.execute('DELETE FROM roles');
        console.log('🗑️ Clearing ships...');
        await database_1.default.execute('DELETE FROM ships');
        console.log('🗑️ Clearing cruise_lines...');
        await database_1.default.execute('DELETE FROM cruise_lines');
        console.log('✅ Database cleanup completed successfully!');
        console.log('📊 All tables have been cleared and are ready for fresh testing.');
    }
    catch (error) {
        console.error('❌ Error during database cleanup:', error);
    }
    finally {
        // Close the connection
        await database_1.default.end();
        process.exit(0);
    }
}
cleanDatabase();
//# sourceMappingURL=cleanDatabase.js.map