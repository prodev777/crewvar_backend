import { createTables, seedInitialData } from '../config/schema';
import { migrateShipsTable, migrateCruiseLinesTable } from '../config/cruiseMigration';
import { csvImporter } from '../utils/csvImporter';
import path from 'path';

export const migrateCruiseData = async (): Promise<void> => {
  try {
    console.log('🚀 Starting cruise data migration...');
    
    // Create/update tables
    await createTables();
    console.log('✅ Database tables created/updated');
    
    // Run specific migrations
    await migrateCruiseLinesTable();
    await migrateShipsTable();
    
    // Seed initial sample data
    await seedInitialData();
    console.log('✅ Sample data seeded');
    
    console.log('🎉 Cruise data migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

export const importCruiseDataFromCSV = async (csvFilePath: string): Promise<void> => {
  try {
    console.log('🚀 Starting CSV import...');
    
    // Ensure tables exist first
    await createTables();
    
    // Import from CSV
    await csvImporter.importFromCSV(csvFilePath);
    
    console.log('🎉 CSV import completed!');
  } catch (error) {
    console.error('❌ CSV import failed:', error);
    throw error;
  }
};

// CLI command handler
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const csvPath = args[1];
  
  if (command === 'migrate') {
    migrateCruiseData()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
      });
  } else if (command === 'import' && csvPath) {
    importCruiseDataFromCSV(csvPath)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Import failed:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  npm run migrate-cruise-data');
    console.log('  npm run import-csv <path-to-csv-file>');
    process.exit(1);
  }
}
