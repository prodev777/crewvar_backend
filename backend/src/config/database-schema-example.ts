// Optimal database structure for cruise data
const databaseSchema = {
  cruise_lines: {
    id: 'VARCHAR(36) PRIMARY KEY',
    name: 'VARCHAR(100) NOT NULL', // "Royal Caribbean"
    code: 'VARCHAR(10)', // "RCL"
    headquarters: 'VARCHAR(100)',
    founded_year: 'INT',
    fleet_size: 'INT',
    website: 'VARCHAR(200)',
    logo_url: 'VARCHAR(500)',
    is_active: 'BOOLEAN DEFAULT TRUE'
  },
  
  ships: {
    id: 'VARCHAR(36) PRIMARY KEY',
    cruise_line_id: 'VARCHAR(36)', // Foreign key
    name: 'VARCHAR(150) NOT NULL', // "Symphony of the Seas"
    code: 'VARCHAR(20)', // "SY"
    capacity: 'INT',
    year_built: 'INT',
    length_ft: 'INT',
    tonnage: 'INT',
    home_port: 'VARCHAR(100)',
    region: 'VARCHAR(50)', // "Caribbean", "Mediterranean"
    ship_type: 'VARCHAR(50)', // "Mega Ship", "Luxury"
    is_active: 'BOOLEAN DEFAULT TRUE'
  },
  
  ports: {
    id: 'VARCHAR(36) PRIMARY KEY',
    name: 'VARCHAR(100) NOT NULL', // "Miami"
    country: 'VARCHAR(100)',
    region: 'VARCHAR(50)',
    coordinates: 'VARCHAR(50)', // "25.7617,-80.1918"
    is_active: 'BOOLEAN DEFAULT TRUE'
  }
};
