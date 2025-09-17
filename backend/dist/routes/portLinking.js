"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../config/database"));
const uuid_1 = require("uuid");
const auth_1 = require("../middleware/auth");
const notificationController_1 = require("../controllers/notificationController");
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
        // Find ships linked by the current user (crew-to-ship linking)
        console.log('🔗 Looking for ships linked by user:', userId, 'on date:', date);
        const [linkedShipsRows] = await database_1.default.execute(`
      SELECT DISTINCT 
        linked_ship_id,
        port_name
      FROM port_linkings 
      WHERE linking_user_id = ? 
        AND linking_date = ? 
        AND is_active = true
    `, [userId, date]);
        // Find connected ships (automatic ship-to-ship connections)
        console.log('🔗 Looking for connected ships:', userShipId, 'on date:', date);
        const [connectedShipsRows] = await database_1.default.execute(`
      SELECT DISTINCT 
        CASE 
          WHEN ship1_id = ? THEN ship2_id
          WHEN ship2_id = ? THEN ship1_id
        END as connected_ship_id
      FROM ship_connections 
      WHERE (ship1_id = ? OR ship2_id = ?)
        AND connection_date = ? 
        AND is_active = true
    `, [userShipId, userShipId, userShipId, userShipId, date]);
        console.log('🔗 Found linked ships:', linkedShipsRows);
        console.log('🔗 Found connected ships:', connectedShipsRows);
        const linkedShipIds = linkedShipsRows.map(row => row.linked_ship_id);
        const connectedShipIds = connectedShipsRows.map(row => row.connected_ship_id).filter(id => id !== null);
        console.log('📊 Ship ID breakdown:', {
            linkedShipIds,
            connectedShipIds,
            userShipId
        });
        // Combine linked and connected ships, removing duplicates
        const allShipIds = [...new Set([...linkedShipIds, ...connectedShipIds])];
        allShipIds.push(userShipId); // Include user's own ship
        console.log('🔗 All ship IDs to query crew from:', allShipIds);
        // Get crew members from linked ships ONLY (exclude user's own ship)
        const linkedShipIdsOnly = allShipIds.filter(shipId => shipId !== userShipId);
        if (linkedShipIdsOnly.length === 0) {
            console.log('🔗 No linked ships found, returning empty crew list');
            return res.json({
                crew: [],
                linkedShips: 0,
                portName: null
            });
        }
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
      WHERE u.current_ship_id IN (${linkedShipIdsOnly.map(() => '?').join(',')})
        AND u.is_active = true
      ORDER BY s.name, u.display_name
    `, [date, ...linkedShipIdsOnly]);
        console.log('👥 Found crew members:', crewRows);
        console.log('📊 Response data:', {
            crewCount: crewRows.length,
            linkedShips: linkedShipIdsOnly.length,
            portName: linkedShipsRows[0]?.port_name || null
        });
        res.json({
            crew: crewRows,
            linkedShips: linkedShipIdsOnly.length,
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
        // Check if current user has already linked this ship (crew-to-ship check)
        const [existingRows] = await database_1.default.execute(`
      SELECT id FROM port_linkings 
      WHERE linking_user_id = ? AND linked_ship_id = ?
        AND linking_date = ?
        AND is_active = true
    `, [userId, shipId, date]);
        if (Array.isArray(existingRows) && existingRows.length > 0) {
            return res.status(400).json({ error: 'You have already linked this ship for this date' });
        }
        // Create port linking (crew-to-ship)
        const linkingId = (0, uuid_1.v4)();
        console.log('🔗 Creating port linking:', {
            linkingId,
            linking_user_id: userId,
            linked_ship_id: shipId,
            portName: portName || null,
            date
        });
        await database_1.default.execute(`
      INSERT INTO port_linkings (id, linking_user_id, linked_ship_id, port_name, linking_date)
      VALUES (?, ?, ?, ?, ?)
    `, [linkingId, userId, shipId, portName || null, date]);
        console.log('✅ Port linking created successfully');
        // Check for automatic ship-to-ship connection
        await checkAndCreateShipConnection(userShipId, shipId, date);
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
        // Get ships that are not already linked by the current user
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
          SELECT DISTINCT linked_ship_id
          FROM port_linkings 
          WHERE linking_user_id = ? 
            AND linking_date = ? 
            AND is_active = true
        )
      ORDER BY cl.name, s.name
    `, [userShipId, userId, date]);
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
        // Deactivate the port linking (crew-to-ship)
        await database_1.default.execute(`
      UPDATE port_linkings 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE linking_user_id = ? AND linked_ship_id = ?
        AND linking_date = ?
    `, [userId, shipId, date]);
        res.json({ message: 'Ships unlinked successfully' });
    }
    catch (error) {
        console.error('Error unlinking ships:', error);
        res.status(500).json({ error: 'Failed to unlink ships' });
    }
});
// Function to check and create automatic ship-to-ship connections
async function checkAndCreateShipConnection(ship1Id, ship2Id, date) {
    try {
        console.log('🔍 Checking for automatic ship connection between:', ship1Id, 'and', ship2Id);
        console.log('📅 Date:', date);
        // Count how many crews from ship1 have linked ship2
        const [ship1ToShip2Count] = await database_1.default.execute(`
      SELECT COUNT(DISTINCT pl.linking_user_id) as count
      FROM port_linkings pl
      JOIN users u ON pl.linking_user_id = u.id COLLATE utf8mb4_unicode_ci
      WHERE u.current_ship_id = ? 
        AND pl.linked_ship_id = ? 
        AND pl.linking_date = ? 
        AND pl.is_active = true
    `, [ship1Id, ship2Id, date]);
        // Count how many crews from ship2 have linked ship1
        const [ship2ToShip1Count] = await database_1.default.execute(`
      SELECT COUNT(DISTINCT pl.linking_user_id) as count
      FROM port_linkings pl
      JOIN users u ON pl.linking_user_id = u.id COLLATE utf8mb4_unicode_ci
      WHERE u.current_ship_id = ? 
        AND pl.linked_ship_id = ? 
        AND pl.linking_date = ? 
        AND pl.is_active = true
    `, [ship2Id, ship1Id, date]);
        const count1to2 = ship1ToShip2Count[0]?.count || 0;
        const count2to1 = ship2ToShip1Count[0]?.count || 0;
        console.log('📊 Link counts:', {
            [`${ship1Id} -> ${ship2Id}`]: count1to2,
            [`${ship2Id} -> ${ship1Id}`]: count2to1,
            threshold: 3
        });
        // Check if both directions have at least 3 crews linking
        if (count1to2 >= 3 && count2to1 >= 3) {
            console.log('🎉 Creating automatic ship-to-ship connection!');
            // Check if connection already exists
            const [existingConnection] = await database_1.default.execute(`
        SELECT id FROM ship_connections 
        WHERE ((ship1_id = ? AND ship2_id = ?) OR (ship1_id = ? AND ship2_id = ?))
          AND connection_date = ? AND is_active = true
      `, [ship1Id, ship2Id, ship2Id, ship1Id, date]);
            if (!Array.isArray(existingConnection) || existingConnection.length === 0) {
                // Create ship connection record
                const connectionId = (0, uuid_1.v4)();
                await database_1.default.execute(`
          INSERT INTO ship_connections (id, ship1_id, ship2_id, connection_date, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [connectionId, ship1Id, ship2Id, date]);
                console.log('✅ Ship connection created:', connectionId);
                // Create notifications for all crew members on both ships
                await createShipConnectionNotifications(ship1Id, ship2Id, date);
            }
            else {
                console.log('ℹ️ Ship connection already exists');
            }
        }
        else {
            console.log('⏳ Not enough crews linking yet:', {
                count1to2,
                count2to1,
                required: 3,
                ship1Id,
                ship2Id,
                date
            });
        }
    }
    catch (error) {
        console.error('Error checking ship connection:', error);
        // Don't fail the main request if this check fails
    }
}
// Function to create notifications for ship connection
async function createShipConnectionNotifications(ship1Id, ship2Id, date) {
    try {
        console.log('🔔 Creating ship connection notifications');
        // Get all crew members from both ships
        const [ship1Crew] = await database_1.default.execute(`
      SELECT id, display_name FROM users WHERE current_ship_id = ? AND is_active = true
    `, [ship1Id]);
        const [ship2Crew] = await database_1.default.execute(`
      SELECT id, display_name FROM users WHERE current_ship_id = ? AND is_active = true
    `, [ship2Id]);
        // Get ship names for notification
        const [ship1Info] = await database_1.default.execute(`SELECT name FROM ships WHERE id = ?`, [ship1Id]);
        const [ship2Info] = await database_1.default.execute(`SELECT name FROM ships WHERE id = ?`, [ship2Id]);
        const ship1Name = ship1Info[0]?.name || 'Ship 1';
        const ship2Name = ship2Info[0]?.name || 'Ship 2';
        // Create notifications for ship1 crew about ship2 connection
        for (const crew of ship1Crew) {
            try {
                await (0, notificationController_1.createNotification)(crew.id, 'ship_connected', 'Ships Docked Together', `Your ship ${ship1Name} and ${ship2Name} are docked together! You can now see all crew members from both ships.`, { ship1Id, ship2Id, connectionDate: date });
            }
            catch (notificationError) {
                console.error('Failed to create notification for crew:', crew.id, notificationError);
            }
        }
        // Create notifications for ship2 crew about ship1 connection
        for (const crew of ship2Crew) {
            try {
                await (0, notificationController_1.createNotification)(crew.id, 'ship_connected', 'Ships Docked Together', `Your ship ${ship2Name} and ${ship1Name} are docked together! You can now see all crew members from both ships.`, { ship1Id, ship2Id, connectionDate: date });
            }
            catch (notificationError) {
                console.error('Failed to create notification for crew:', crew.id, notificationError);
            }
        }
        console.log('✅ Ship connection notifications created');
    }
    catch (error) {
        console.error('Error creating ship connection notifications:', error);
    }
}
exports.default = router;
//# sourceMappingURL=portLinking.js.map