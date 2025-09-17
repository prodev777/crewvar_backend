import pool from '../config/database';

async function cleanDatabase() {
    try {
        console.log('🧹 Starting database cleanup...');
        
        // Clear connection-related data first (due to foreign key constraints)
        console.log('🗑️ Clearing connection_requests...');
        await pool.execute('DELETE FROM connection_requests');
        
        console.log('🗑️ Clearing connections...');
        await pool.execute('DELETE FROM connections');
        
        // Clear user data
        console.log('🗑️ Clearing users...');
        await pool.execute('DELETE FROM users');
        
        console.log('🗑️ Clearing departments...');
        await pool.execute('DELETE FROM departments');
        
        console.log('🗑️ Clearing subcategories...');
        await pool.execute('DELETE FROM subcategories');
        
        console.log('🗑️ Clearing roles...');
        await pool.execute('DELETE FROM roles');
        
        console.log('🗑️ Clearing ships...');
        await pool.execute('DELETE FROM ships');
        
        console.log('🗑️ Clearing cruise_lines...');
        await pool.execute('DELETE FROM cruise_lines');
        
        console.log('✅ Database cleanup completed successfully!');
        console.log('📊 All tables have been cleared and are ready for fresh testing.');
        
    } catch (error) {
        console.error('❌ Error during database cleanup:', error);
    } finally {
        // Close the connection
        await pool.end();
        process.exit(0);
    }
}

cleanDatabase();