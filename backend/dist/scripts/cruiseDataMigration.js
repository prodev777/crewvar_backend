"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importCruiseDataFromCSV = exports.migrateCruiseData = void 0;
const schema_1 = require("../config/schema");
const cruiseMigration_1 = require("../config/cruiseMigration");
const csvImporter_1 = require("../utils/csvImporter");
const migrateCruiseData = async () => {
    try {
        console.log('🚀 Starting cruise data migration...');
        // Create/update tables
        await (0, schema_1.createTables)();
        console.log('✅ Database tables created/updated');
        // Run specific migrations
        await (0, cruiseMigration_1.migrateCruiseLinesTable)();
        await (0, cruiseMigration_1.migrateShipsTable)();
        // Seed initial sample data
        await (0, schema_1.seedInitialData)();
        console.log('✅ Sample data seeded');
        console.log('🎉 Cruise data migration completed!');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
};
exports.migrateCruiseData = migrateCruiseData;
const importCruiseDataFromCSV = async (csvFilePath) => {
    try {
        console.log('🚀 Starting CSV import...');
        // Ensure tables exist first
        await (0, schema_1.createTables)();
        // Import from CSV
        await csvImporter_1.csvImporter.importFromCSV(csvFilePath);
        console.log('🎉 CSV import completed!');
    }
    catch (error) {
        console.error('❌ CSV import failed:', error);
        throw error;
    }
};
exports.importCruiseDataFromCSV = importCruiseDataFromCSV;
// CLI command handler
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    const csvPath = args[1];
    if (command === 'migrate') {
        (0, exports.migrateCruiseData)()
            .then(() => process.exit(0))
            .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
    }
    else if (command === 'import' && csvPath) {
        (0, exports.importCruiseDataFromCSV)(csvPath)
            .then(() => process.exit(0))
            .catch((error) => {
            console.error('Import failed:', error);
            process.exit(1);
        });
    }
    else {
        console.log('Usage:');
        console.log('  npm run migrate-cruise-data');
        console.log('  npm run import-csv <path-to-csv-file>');
        process.exit(1);
    }
}
//# sourceMappingURL=cruiseDataMigration.js.map