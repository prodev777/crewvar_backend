import { pool } from '../config/database';

// Script to check connection_requests table structure
const checkTableStructure = async () => {
    try {
        console.log('🔍 Checking connection_requests table structure...');
        
        const [columns] = await pool.execute('DESCRIBE connection_requests');
        console.log('📊 Table columns:');
        console.table(columns);
        
        // Also check if table exists
        const [tables] = await pool.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME IN ('connection_requests', 'user_blocks', 'connection_activity')
        `);
        
        console.log('📋 Existing tables:');
        console.table(tables);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkTableStructure();
