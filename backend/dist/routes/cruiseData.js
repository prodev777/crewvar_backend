"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../config/database"));
const router = express_1.default.Router();
// Get all cruise lines
router.get('/cruise-lines', async (req, res) => {
    try {
        const [rows] = await database_1.default.execute(`
      SELECT * FROM cruise_lines 
      WHERE is_active = true 
      ORDER BY name ASC
    `);
        res.json({ cruiseLines: rows });
    }
    catch (error) {
        console.error('Error fetching cruise lines:', error);
        res.status(500).json({ error: 'Failed to fetch cruise lines' });
    }
});
// Get ships by cruise line
router.get('/cruise-lines/:cruiseLineId/ships', async (req, res) => {
    try {
        const { cruiseLineId } = req.params;
        const [rows] = await database_1.default.execute(`
      SELECT s.*, cl.name as cruise_line_name 
      FROM ships s
      JOIN cruise_lines cl ON s.cruise_line_id = cl.id
      WHERE s.cruise_line_id = ? AND s.is_active = true
      ORDER BY s.name ASC
    `, [cruiseLineId]);
        res.json({ ships: rows });
    }
    catch (error) {
        console.error('Error fetching ships:', error);
        res.status(500).json({ error: 'Failed to fetch ships' });
    }
});
// Get all ships with cruise line info
router.get('/ships', async (req, res) => {
    try {
        const [rows] = await database_1.default.execute(`
      SELECT s.*, cl.name as cruise_line_name, cl.company_code
      FROM ships s
      JOIN cruise_lines cl ON s.cruise_line_id = cl.id
      WHERE s.is_active = true
      ORDER BY cl.name ASC, s.name ASC
    `);
        res.json({ ships: rows });
    }
    catch (error) {
        console.error('Error fetching ships:', error);
        res.status(500).json({ error: 'Failed to fetch ships' });
    }
});
// Get ship by ID
router.get('/ships/:shipId', async (req, res) => {
    try {
        const { shipId } = req.params;
        const [rows] = await database_1.default.execute(`
      SELECT s.*, cl.name as cruise_line_name, cl.company_code, cl.headquarters
      FROM ships s
      JOIN cruise_lines cl ON s.cruise_line_id = cl.id
      WHERE s.id = ? AND s.is_active = true
    `, [shipId]);
        if (Array.isArray(rows) && rows.length === 0) {
            return res.status(404).json({ error: 'Ship not found' });
        }
        res.json({ ship: rows[0] });
    }
    catch (error) {
        console.error('Error fetching ship:', error);
        res.status(500).json({ error: 'Failed to fetch ship' });
    }
});
// Search ships by name
router.get('/ships/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const searchTerm = `%${query}%`;
        const [rows] = await database_1.default.execute(`
      SELECT s.*, cl.name as cruise_line_name, cl.company_code
      FROM ships s
      JOIN cruise_lines cl ON s.cruise_line_id = cl.id
      WHERE s.is_active = true 
      AND (s.name LIKE ? OR cl.name LIKE ?)
      ORDER BY cl.name ASC, s.name ASC
      LIMIT 20
    `, [searchTerm, searchTerm]);
        res.json({ ships: rows });
    }
    catch (error) {
        console.error('Error searching ships:', error);
        res.status(500).json({ error: 'Failed to search ships' });
    }
});
exports.default = router;
//# sourceMappingURL=cruiseData.js.map