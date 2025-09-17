"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addProfileColumns = void 0;
const database_1 = __importDefault(require("../config/database"));
const addProfileColumns = async () => {
    try {
        console.log('🔄 Adding profile columns to users table...');
        // Update profile_photo column to support large base64 data
        try {
            await database_1.default.execute('ALTER TABLE users MODIFY COLUMN profile_photo LONGTEXT');
            console.log('✅ Updated profile_photo column to LONGTEXT');
        }
        catch (error) {
            console.log(`ℹ️ Profile photo column update: ${error.message}`);
        }
        // Add new columns to users table
        const columns = [
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram VARCHAR(255)',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter VARCHAR(255)',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook VARCHAR(255)',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS snapchat VARCHAR(255)',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255)',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS additional_photo_1 LONGTEXT',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS additional_photo_2 LONGTEXT',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS additional_photo_3 LONGTEXT'
        ];
        for (const column of columns) {
            try {
                await database_1.default.execute(column);
                console.log(`✅ Column added: ${column.split(' ')[5]}`);
            }
            catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ Column already exists: ${column.split(' ')[5]}`);
                }
                else {
                    console.error(`❌ Error adding column: ${error.message}`);
                }
            }
        }
        console.log('✅ Profile columns migration completed');
    }
    catch (error) {
        console.error('❌ Error in profile columns migration:', error?.message, error?.stack);
        throw error;
    }
};
exports.addProfileColumns = addProfileColumns;
// Run migration if called directly
if (require.main === module) {
    addProfileColumns()
        .then(() => {
        console.log('🎉 Migration completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=addProfileColumns.js.map