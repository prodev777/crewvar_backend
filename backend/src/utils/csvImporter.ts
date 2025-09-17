import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';

export interface CruiseLineData {
  name: string;
  company_code?: string;
  headquarters?: string;
  founded_year?: number;
  fleet_size?: number;
  website?: string;
  logo_url?: string;
}

export interface ShipData {
  name: string;
  cruise_line_name: string;
  ship_code?: string;
  capacity?: number;
  length_meters?: number;
  width_meters?: number;
  gross_tonnage?: number;
  year_built?: number;
  refurbished_year?: number;
  home_port?: string;
  ship_type?: string;
}

export class CSVImporter {
  private cruiseLines: Map<string, string> = new Map(); // name -> id mapping

  async importCruiseLinesFromCSV(filePath: string): Promise<void> {
    console.log('🚢 Starting cruise lines import from:', filePath);
    
    return new Promise((resolve, reject) => {
      const cruiseLines: CruiseLineData[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Skip if this row doesn't have cruise line data or is empty
          if (!row.CruiseLine && !row.cruise_line_name && !row.company_name) return;
          if (!row.CruiseLine || row.CruiseLine.trim() === '') return;
          
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
          } catch (error) {
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

  async importShipsFromCSV(filePath: string): Promise<void> {
    console.log('🚢 Starting ships import from:', filePath);
    
    return new Promise((resolve, reject) => {
      const ships: ShipData[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Skip if this row doesn't have ship data or is empty
          if (!row.ShipName && !row.ship_name && !row.vessel_name) return;
          if (!row.ShipName || row.ShipName.trim() === '') return;
          
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
          } catch (error) {
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

  private async insertCruiseLines(cruiseLines: CruiseLineData[]): Promise<void> {
    for (const cruiseLine of cruiseLines) {
      try {
        const id = uuidv4();
        
        await pool.execute(`
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
      } catch (error) {
        console.error(`❌ Error inserting cruise line ${cruiseLine.name}:`, error);
      }
    }
  }

  private async insertShips(ships: ShipData[]): Promise<void> {
    for (const ship of ships) {
      try {
        // Get cruise line ID
        const cruiseLineId = this.cruiseLines.get(ship.cruise_line_name);
        if (!cruiseLineId) {
          console.warn(`⚠️ Cruise line not found for ship ${ship.name}: ${ship.cruise_line_name}`);
          continue;
        }
        
        const id = uuidv4();
        
        await pool.execute(`
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
      } catch (error) {
        console.error(`❌ Error inserting ship ${ship.name}:`, error);
      }
    }
  }

  async importFromCSV(filePath: string): Promise<void> {
    console.log('🚀 Starting CSV import process...');
    
    try {
      // First import cruise lines
      await this.importCruiseLinesFromCSV(filePath);
      
      // Then import ships
      await this.importShipsFromCSV(filePath);
      
      console.log('🎉 CSV import completed successfully!');
    } catch (error) {
      console.error('❌ CSV import failed:', error);
      throw error;
    }
  }
}

export const csvImporter = new CSVImporter();
