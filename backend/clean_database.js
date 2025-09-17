const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'crewvar'
    });

    try {
        console.log('🧹 Cleaning database for testing...');

        const tablesToClean = [
            'ship_connections',
            'port_linkings',
            'connection_requests',
            'connections',
            'user_port_status',
            'notifications',
            'favorites',
            'users' // Users table must be last due to foreign key constraints
        ];

        // Disable foreign key checks temporarily
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of tablesToClean) {
            console.log(`🗑️ Cleaning ${table}...`);
            if (table === 'users') {
                // Use DELETE for users table due to foreign key constraints
                await connection.execute(`DELETE FROM ${table}`);
            } else {
                await connection.execute(`TRUNCATE TABLE ${table}`);
            }
            console.log(`✅ ${table} cleaned`);
        }

        // Re-enable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log('🔄 Resetting auto-increment counters...');
        for (const table of tablesToClean) {
            // Note: AUTO_INCREMENT reset might not be strictly necessary for UUID tables
            // but is good practice for tables with auto-incrementing primary keys.
            await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        }
        console.log('✅ Database cleaned successfully!');
        console.log('\n📊 Database is now ready for fresh testing');

    } catch (error) {
        console.error('❌ Error cleaning database:', error);
    } finally {
        await connection.end();
    }
}

cleanDatabase();
