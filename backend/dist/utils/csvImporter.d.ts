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
export declare class CSVImporter {
    private cruiseLines;
    importCruiseLinesFromCSV(filePath: string): Promise<void>;
    importShipsFromCSV(filePath: string): Promise<void>;
    private insertCruiseLines;
    private insertShips;
    importFromCSV(filePath: string): Promise<void>;
}
export declare const csvImporter: CSVImporter;
//# sourceMappingURL=csvImporter.d.ts.map