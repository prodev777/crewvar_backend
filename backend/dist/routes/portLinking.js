"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../config/database"));
const uuid_1 = require("uuid");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get port connections for a ship
router.get('/connections', auth_1.authenticateToken, async (req, res) => {
    try {
        const { shipId, date } = req.query;
        const userId = req.user?.userId;
        // Get user's current ship if shipId not provided
        let targetShipId = shipId;
        if (!targetShipId) {
            const [userRows] = await database_1.default.execute(`
        SELECT current_ship_id FROM users WHERE id = ?
      `, [userId]);
            if (!Array.isArray(userRows) || userRows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            targetShipId = userRows[0].current_ship_id;
            if (!targetShipId) {
                return res.status(400).json({ error: 'User has no current ship assigned' });
            }
        }
        // Get port connections for the ship
        const [connectionsRows] = await database_1.default.execute(`
      SELECT 
        pc.id, pc.ship_id_1, pc.ship_id_2, pc.port_name, pc.date, 
        pc.start_time, pc.end_time, pc.status, pc.created_at,
        s1.name as ship1_name,
        s2.name as ship2_name
      FROM port_connections pc
      LEFT JOIN ships s1 ON pc.ship_id_1 = s1.id
      LEFT JOIN ships s2 ON pc.ship_id_2 = s2.id
      WHERE (pc.ship_id_1 = ? OR pc.ship_id_2 = ?)
      ${date ? 'AND pc.date = ?' : ''}
      ORDER BY pc.created_at DESC
    `, date ? [targetShipId, targetShipId, date] : [targetShipId, targetShipId]);
        res.json({ connections: connectionsRows });
    }
    catch (error) {
        console.error('Get port connections error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get crew members in the same port (linked ships)
router.get('/crew-in-port', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { date = new Date().toISOString().split('T')[0] } = req.query;
        // Get user's current ship
        const [userRows] = await database_1.default.execute(`
      SELECT current_ship_id FROM users WHERE id = ?
    `, [userId]);
        if (!Array.isArray(userRows) || userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userShipId = userRows[0].current_ship_id;
        if (!userShipId) {
            console.log('User has no ship assigned, returning empty crew list for port linking');
            return res.json({
                crew: [],
                linkedShips: 0,
                portName: null
            });
        }
        // Find linked ships for the given date (only ships that current user initiated the link with)
        console.log('🔗 Looking for ships linked by user ship:', userShipId, 'on date:', date);
        const [linkedShipsRows] = await database_1.default.execute(`
      SELECT DISTINCT 
        ship2_id as linked_ship_id,
        port_name
      FROM port_linkings 
      WHERE ship1_id = ? 
        AND linking_date = ? 
        AND is_active = true
    `, [userShipId, date]);
        console.log('🔗 Found linked ships:', linkedShipsRows);
        const linkedShipIds = linkedShipsRows.map(row => row.linked_ship_id);
        linkedShipIds.push(userShipId); // Include user's own ship
        console.log('🔗 All ship IDs to query crew from:', linkedShipIds);
        // Get crew members from all linked ships
        const [crewRows] = await database_1.default.execute(`
      SELECT 
        u.id,
        u.display_name,
        u.profile_photo,
        u.department_id,
        u.subcategory_id,
        u.role_id,
        u.current_ship_id,
        s.name as ship_name,
        cl.name as cruise_line_name,
        ups.port_name,
        ups.status
      FROM users u
      JOIN ships s ON u.current_ship_id = s.id
      JOIN cruise_lines cl ON s.cruise_line_id = cl.id
      LEFT JOIN user_port_status ups ON u.id = ups.user_id AND ups.status_date = ?
      WHERE u.current_ship_id IN (${linkedShipIds.map(() => '?').join(',')})
        AND u.id != ?
        AND u.is_active = true
      ORDER BY s.name, u.display_name
    `, [date, ...linkedShipIds, userId]);
        console.log('👥 Found crew members:', crewRows);
        console.log('📊 Response data:', {
            crewCount: crewRows.length,
            linkedShips: linkedShipIds.length - 1,
            portName: linkedShipsRows[0]?.port_name || null
        });
        res.json({
            crew: crewRows,
            linkedShips: linkedShipIds.length - 1, // Exclude user's own ship
            portName: linkedShipsRows[0]?.port_name || null
        });
    }
    catch (error) {
        console.error('Error fetching crew in port:', error);
        res.status(500).json({ error: 'Failed to fetch crew in port' });
    }
});
// Link ships in port
router.post('/link-ships', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { shipId, portName, date = new Date().toISOString().split('T')[0] } = req.body;
        if (!shipId) {
            return res.status(400).json({ error: 'Ship ID is required' });
        }
        // Get user's current ship
        const [userRows] = await database_1.default.execute(`
      SELECT current_ship_id FROM users WHERE id = ?
    `, [userId]);
        if (!Array.isArray(userRows) || userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userShipId = userRows[0].current_ship_id;
        if (!userShipId) {
            return res.status(400).json({ error: 'User has no current ship assigned' });
        }
        if (userShipId === shipId) {
            return res.status(400).json({ error: 'Cannot link ship with itself' });
        }
        // Check if current user has already linked this ship (unidirectional check)
        const [existingRows] = await database_1.default.execute(`
      SELECT id FROM port_linkings 
      WHERE ship1_id = ? AND ship2_id = ?
        AND linking_date = ?
        AND is_active = true
    `, [userShipId, shipId, date]);
        if (Array.isArray(existingRows) && existingRows.length > 0) {
            return res.status(400).json({ error: 'You have already linked this ship for this date' });
        }
        // Create port linking
        const linkingId = (0, uuid_1.v4)();
        console.log('🔗 Creating port linking:', {
            linkingId,
            ship1_id: userShipId,
            ship2_id: shipId,
            portName: portName || null,
            date,
            created_by: userId
        });
        await database_1.default.execute(`
      INSERT INTO port_linkings (id, ship1_id, ship2_id, port_name, linking_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [linkingId, userShipId, shipId, portName || null, date, userId]);
        console.log('✅ Port linking created successfully');
        // Update user port status
        await database_1.default.execute(`
      INSERT INTO user_port_status (id, user_id, ship_id, port_name, status, status_date)
      VALUES (?, ?, ?, ?, 'docked', ?)
      ON DUPLICATE KEY UPDATE
        port_name = VALUES(port_name),
        status = 'docked',
        updated_at = CURRENT_TIMESTAMP
    `, [(0, uuid_1.v4)(), userId, userShipId, portName || null, date]);
        res.json({
            message: 'Ships linked successfully',
            linkingId,
            linkedShips: [userShipId, shipId],
            portName: portName || null
        });
    }
    catch (error) {
        console.error('Error linking ships:', error);
        res.status(500).json({ error: 'Failed to link ships' });
    }
});
// Get available ships to link with
router.get('/available-ships', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { date = new Date().toISOString().split('T')[0] } = req.query;
        // Get user's current ship
        const [userRows] = await database_1.default.execute(`
      SELECT current_ship_id FROM users WHERE id = ?
    `, [userId]);
        if (!Array.isArray(userRows) || userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userShipId = userRows[0].current_ship_id;
        if (!userShipId) {
            return res.status(400).json({ error: 'User has no current ship assigned' });
        }
        // Get ships that are not already linked with user's ship (only check ships user initiated links with)
        const [shipsRows] = await database_1.default.execute(`
      SELECT DISTINCT
        s.id,
        s.name,
        cl.name as cruise_line_name,
        s.home_port,
        s.capacity
      FROM ships s
      JOIN cruise_lines cl ON s.cruise_line_id = cl.id
      WHERE s.id != ?
        AND s.is_active = true
        AND s.id NOT IN (
          SELECT DISTINCT ship2_id
          FROM port_linkings 
          WHERE ship1_id = ? 
            AND linking_date = ? 
            AND is_active = true
        )
      ORDER BY cl.name, s.name
    `, [userShipId, userShipId, date]);
        res.json({ ships: shipsRows });
    }
    catch (error) {
        console.error('Error fetching available ships:', error);
        res.status(500).json({ error: 'Failed to fetch available ships' });
    }
});
// Unlink ships
router.delete('/unlink-ships/:shipId', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { shipId } = req.params;
        const { date = new Date().toISOString().split('T')[0] } = req.query;
        // Get user's current ship
        const [userRows] = await database_1.default.execute(`
      SELECT current_ship_id FROM users WHERE id = ?
    `, [userId]);
        if (!Array.isArray(userRows) || userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userShipId = userRows[0].current_ship_id;
        // Deactivate the port linking
        await database_1.default.execute(`
      UPDATE port_linkings 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE ((ship1_id = ? AND ship2_id = ?) OR (ship1_id = ? AND ship2_id = ?))
        AND linking_date = ?
        AND created_by = ?
    `, [userShipId, shipId, shipId, userShipId, date, userId]);
        res.json({ message: 'Ships unlinked successfully' });
    }
    catch (error) {
        console.error('Error unlinking ships:', error);
        res.status(500).json({ error: 'Failed to unlink ships' });
    }
});
exports.default = router;
//# sourceMappingURL=portLinking.js.map