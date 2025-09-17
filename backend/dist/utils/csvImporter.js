"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csvImporter = exports.CSVImporter = void 0;
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../config/database"));
class CSVImporter {
    constructor() {
        this.cruiseLines = new Map(); // name -> id mapping
    }
    async importCruiseLinesFromCSV(filePath) {
        console.log('🚢 Starting cruise lines import from:', filePath);
        return new Promise((resolve, reject) => {
            const cruiseLines = [];
            fs_1.default.createReadStream(filePath)
                .pipe((0, csv_parser_1.default)())
                .on('data', (row) => {
                // Skip if this row doesn't have cruise line data or is empty
                if (!row.CruiseLine && !row.cruise_line_name && !row.company_name)
                    return;
                if (!row.CruiseLine || row.CruiseLine.trim() === '')
                    return;
                const cruiseLineName = row.CruiseLine || row.cruise_line_name || row.company_name;
                // Check if we already have this cruise line
                const existing = cruiseLines.find(cl => cl.name === cruiseLineName);
                if (!existing) {
                    cruiseLines.push({
                        name: cruiseLineName,
                        company_code: row.company_code || row.cruise_line_code,
                        headquarters: row.headquarters || row.hq,
                        founded_year: row.founded_year ? parseInt(row.founded_year) : undefined,
                        fleet_size: row.fleet_size ? parseInt(row.fleet_size) : undefined,
                        website: row.website,
                        logo_url: row.logo_url
                    });
                }
            })
                .on('end', async () => {
                try {
                    console.log(`📊 Found ${cruiseLines.length} unique cruise lines`);
                    await this.insertCruiseLines(cruiseLines);
                    console.log('✅ Cruise lines imported successfully');
                    resolve();
                }
                catch (error) {
                    console.error('❌ Error importing cruise lines:', error);
                    reject(error);
                }
            })
                .on('error', (error) => {
                console.error('❌ Error reading CSV file:', error);
                reject(error);
            });
        });
    }
    async importShipsFromCSV(filePath) {
        console.log('🚢 Starting ships import from:', filePath);
        return new Promise((resolve, reject) => {
            const ships = [];
            fs_1.default.createReadStream(filePath)
                .pipe((0, csv_parser_1.default)())
                .on('data', (row) => {
                // Skip if this row doesn't have ship data or is empty
                if (!row.ShipName && !row.ship_name && !row.vessel_name)
                    return;
                if (!row.ShipName || row.ShipName.trim() === '')
                    return;
                const shipName = row.ShipName || row.ship_name || row.vessel_name;
                const cruiseLineName = row.CruiseLine || row.cruise_line_name || row.company_name;
                ships.push({
                    name: shipName,
                    cruise_line_name: cruiseLineName,
                    ship_code: row.ship_code || row.vessel_code,
                    capacity: row.capacity ? parseInt(row.capacity) : undefined,
                    length_meters: row.length_meters ? parseFloat(row.length_meters) : undefined,
                    width_meters: row.width_meters ? parseFloat(row.width_meters) : undefined,
                    gross_tonnage: row.gross_tonnage ? parseInt(row.gross_tonnage) : undefined,
                    year_built: row.year_built ? parseInt(row.year_built) : undefined,
                    refurbished_year: row.refurbished_year ? parseInt(row.refurbished_year) : undefined,
                    home_port: row.home_port || row.homeport,
                    ship_type: row.ship_type || row.vessel_type
                });
            })
                .on('end', async () => {
                try {
                    console.log(`📊 Found ${ships.length} ships`);
                    await this.insertShips(ships);
                    console.log('✅ Ships imported successfully');
                    resolve();
                }
                catch (error) {
                    console.error('❌ Error importing ships:', error);
                    reject(error);
                }
            })
                .on('error', (error) => {
                console.error('❌ Error reading CSV file:', error);
                reject(error);
            });
        });
    }
    async insertCruiseLines(cruiseLines) {
        for (const cruiseLine of cruiseLines) {
            try {
                const id = (0, uuid_1.v4)();
                await database_1.default.execute(`
          INSERT INTO cruise_lines (id, name, company_code, headquarters, founded_year, fleet_size, website, logo_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            company_code = VALUES(company_code),
            headquarters = VALUES(headquarters),
            founded_year = VALUES(founded_year),
            fleet_size = VALUES(fleet_size),
            website = VALUES(website),
            logo_url = VALUES(logo_url),
            updated_at = CURRENT_TIMESTAMP
        `, [
                    id,
                    cruiseLine.name,
                    cruiseLine.company_code || null,
                    cruiseLine.headquarters || null,
                    cruiseLine.founded_year || null,
                    cruiseLine.fleet_size || null,
                    cruiseLine.website || null,
                    cruiseLine.logo_url || null
                ]);
                this.cruiseLines.set(cruiseLine.name, id);
                console.log(`✅ Inserted cruise line: ${cruiseLine.name}`);
            }
            catch (error) {
                console.error(`❌ Error inserting cruise line ${cruiseLine.name}:`, error);
            }
        }
    }
    async insertShips(ships) {
        for (const ship of ships) {
            try {
                // Get cruise line ID
                const cruiseLineId = this.cruiseLines.get(ship.cruise_line_name);
                if (!cruiseLineId) {
                    console.warn(`⚠️ Cruise line not found for ship ${ship.name}: ${ship.cruise_line_name}`);
                    continue;
                }
                const id = (0, uuid_1.v4)();
                await database_1.default.execute(`
          INSERT INTO ships (id, name, cruise_line_id, ship_code, capacity, length_meters, width_meters, gross_tonnage, year_built, refurbished_year, home_port, ship_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            ship_code = VALUES(ship_code),
            capacity = VALUES(capacity),
            length_meters = VALUES(length_meters),
            width_meters = VALUES(width_meters),
            gross_tonnage = VALUES(gross_tonnage),
            year_built = VALUES(year_built),
            refurbished_year = VALUES(refurbished_year),
            home_port = VALUES(home_port),
            ship_type = VALUES(ship_type),
            updated_at = CURRENT_TIMESTAMP
        `, [
                    id,
                    ship.name,
                    cruiseLineId,
                    ship.ship_code || null,
                    ship.capacity || null,
                    ship.length_meters || null,
                    ship.width_meters || null,
                    ship.gross_tonnage || null,
                    ship.year_built || null,
                    ship.refurbished_year || null,
                    ship.home_port || null,
                    ship.ship_type || null
                ]);
                console.log(`✅ Inserted ship: ${ship.name} (${ship.cruise_line_name})`);
            }
            catch (error) {
                console.error(`❌ Error inserting ship ${ship.name}:`, error);
            }
        }
    }
    async importFromCSV(filePath) {
        console.log('🚀 Starting CSV import process...');
        try {
            // First import cruise lines
            await this.importCruiseLinesFromCSV(filePath);
            // Then import ships
            await this.importShipsFromCSV(filePath);
            console.log('🎉 CSV import completed successfully!');
        }
        catch (error) {
            console.error('❌ CSV import failed:', error);
            throw error;
        }
    }
}
exports.CSVImporter = CSVImporter;
exports.csvImporter = new CSVImporter();
//# sourceMappingURL=csvImporter.js.map