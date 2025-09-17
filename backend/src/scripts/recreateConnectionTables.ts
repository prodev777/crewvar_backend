import { pool } from '../config/database';

// Script to drop and recreate connection tables
const recreateConnectionTables = async () => {
    try {
        console.log('🗑️ Dropping existing connection tables...');
        
        // Drop tables in reverse order to handle foreign key constraints
        await pool.execute('DROP TABLE IF EXISTS connection_activity');
        await pool.execute('DROP TABLE IF EXISTS user_blocks');
        await pool.execute('DROP TABLE IF EXISTS connection_requests');
        
        console.log('✅ Tables dropped successfully!');
        
        // Import and run the creation function
        const { createConnectionTables } = await import('../config/connectionTables');
        const success = await createConnectionTables();
        
        if (success) {
            console.log('✅ Connection tables recreated successfully!');
            process.exit(0);
        } else {
            console.log('❌ Failed to recreate connection tables');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

recreateConnectionTables();
