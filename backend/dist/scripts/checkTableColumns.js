"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// Script to check connection_requests table structure
const checkTableStructure = async () => {
    try {
        console.log('🔍 Checking connection_requests table structure...');
        const [columns] = await database_1.pool.execute('SHOW COLUMNS FROM connection_requests');
        console.log('📊 Table columns:');
        columns.forEach((col) => {
            console.log(`- ${col.Field} (${col.Type})`);
        });
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};
checkTableStructure();
//# sourceMappingURL=checkTableColumns.js.map