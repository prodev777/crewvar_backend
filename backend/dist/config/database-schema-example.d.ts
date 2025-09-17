declare const databaseSchema: {
    cruise_lines: {
        id: string;
        name: string;
        code: string;
        headquarters: string;
        founded_year: string;
        fleet_size: string;
        website: string;
        logo_url: string;
        is_active: string;
    };
    ships: {
        id: string;
        cruise_line_id: string;
        name: string;
        code: string;
        capacity: string;
        year_built: string;
        length_ft: string;
        tonnage: string;
        home_port: string;
        region: string;
        ship_type: string;
        is_active: string;
    };
    ports: {
        id: string;
        name: string;
        country: string;
        region: string;
        coordinates: string;
        is_active: string;
    };
};
//# sourceMappingURL=database-schema-example.d.ts.map