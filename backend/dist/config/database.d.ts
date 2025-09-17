import mysql from 'mysql2/promise';
export declare const pool: mysql.Pool;
export declare const testConnection: () => Promise<boolean>;
export declare const initializeDatabase: () => Promise<void>;
export default pool;
//# sourceMappingURL=database.d.ts.map