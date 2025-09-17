import { pool } from '../config/database';

// Script to check connection_requests table structure
const checkTableStructure = async () => {
    try {
        console.log('🔍 Checking connection_requests table structure...');
        
        const [columns] = await pool.execute('SHOW COLUMNS FROM connection_requests');
        console.log('📊 Table columns:');
        (columns as any[]).forEach((col: any) => {
            console.log(`- ${col.Field} (${col.Type})`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkTableStructure();
