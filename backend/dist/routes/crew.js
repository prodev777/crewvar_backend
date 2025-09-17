"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get crew members on the same ship as the user
router.get('/onboard', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        console.log('🚢 CREW ONBOARD REQUEST RECEIVED');
        console.log('Crew onboard request - User ID:', userId);
        console.log('Request headers:', req.headers);
        console.log('Request user object:', req.user);
        if (!userId) {
            console.log('No user ID found in request');
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get user's current ship (if any)
        const [userRows] = await database_1.pool.execute(`
            SELECT u.current_ship_id, s.name as ship_name, cl.name as cruise_line_name
            FROM users u
            LEFT JOIN ships s ON u.current_ship_id = s.id
            LEFT JOIN cruise_lines cl ON s.cruise_line_id = cl.id
            WHERE u.id = ? AND u.is_active = true
        `, [userId]);
        if (userRows.length === 0) {
            console.log('User not found:', userId);
            return res.status(404).json({ error: 'User not found' });
        }
        const userShip = userRows[0];
        const userShipId = userShip.current_ship_id;
        console.log('User ship info:', userShip);
        // If user doesn't have a ship assigned, return empty crew list
        if (!userShipId) {
            console.log('User has no ship assigned, returning empty crew list');
            return res.json({
                success: true,
                crew: [],
                shipInfo: {
                    ship_name: 'No ship assigned',
                    cruise_line_name: 'Please complete your profile',
                    total_crew: 0
                }
            });
        }
        // Get all crew members on the same ship (excluding the user)
        const [crewRows] = await database_1.pool.execute(`
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
                COALESCE(d.name, 'Not specified') as department_name,
                COALESCE(sc.name, 'Not specified') as subcategory_name,
                COALESCE(r.name, 'Not specified') as role_name
            FROM users u
            JOIN ships s ON u.current_ship_id = s.id
            JOIN cruise_lines cl ON s.cruise_line_id = cl.id
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN subcategories sc ON u.subcategory_id = sc.id
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.current_ship_id = ?
                AND u.id != ?
                AND u.is_active = true
            ORDER BY u.display_name
        `, [userShipId, userId]);
        console.log('Raw crew query results:', crewRows);
        console.log('Number of crew rows found:', crewRows.length);
        const crew = crewRows.map(row => ({
            id: row.id,
            display_name: row.display_name,
            profile_photo: row.profile_photo,
            department_name: row.department_name,
            subcategory_name: row.subcategory_name,
            role_name: row.role_name,
            ship_name: row.ship_name,
            cruise_line_name: row.cruise_line_name
        }));
        console.log('Found crew members:', crew.length);
        console.log('Crew members data:', crew);
        res.json({
            success: true,
            crew,
            shipInfo: {
                ship_name: userShip.ship_name,
                cruise_line_name: userShip.cruise_line_name,
                total_crew: crew.length + 1 // +1 for the user themselves
            }
        });
    }
    catch (error) {
        console.error('Error fetching crew onboard:', error);
        res.status(500).json({ error: 'Failed to fetch crew onboard' });
    }
});
// Get crew member profile for viewing
router.get('/profile/:userId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { userId: targetUserId } = req.params;
        const currentUserId = req.user?.userId;
        console.log('Crew profile request - targetUserId:', targetUserId);
        console.log('Crew profile request - currentUserId:', currentUserId);
        if (!currentUserId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get target user's profile with additional profile data
        console.log('Executing user profile query for:', targetUserId);
        const [userRows] = await database_1.pool.execute(`
            SELECT 
                u.id,
                u.display_name,
                u.profile_photo,
                u.department_id,
                u.subcategory_id,
                u.role_id,
                u.current_ship_id,
                u.bio,
                u.phone,
                u.instagram,
                u.twitter,
                u.facebook,
                u.snapchat,
                u.website,
                u.additional_photo_1,
                u.additional_photo_2,
                u.additional_photo_3,
                COALESCE(s.name, 'Unknown Ship') as ship_name,
                COALESCE(cl.name, 'Unknown Cruise Line') as cruise_line_name,
                COALESCE(d.name, 'Not specified') as department_name,
                COALESCE(sc.name, 'Not specified') as subcategory_name,
                COALESCE(r.name, 'Not specified') as role_name,
                u.created_at,
                u.is_active
            FROM users u
            LEFT JOIN ships s ON u.current_ship_id = s.id
            LEFT JOIN cruise_lines cl ON s.cruise_line_id = cl.id
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN subcategories sc ON u.subcategory_id = sc.id
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ? AND u.is_active = true
        `, [targetUserId]);
        console.log('User profile query result:', userRows);
        if (userRows.length === 0) {
            console.log('User not found in database, returning mock profile for testing');
            // Return a mock profile for testing purposes
            const mockProfile = {
                id: targetUserId,
                display_name: 'Alex Thompson',
                profile_photo: null,
                department_name: 'Entertainment',
                subcategory_name: 'Cruise Director',
                role_name: 'Cruise Director',
                ship_name: 'AIDAblu',
                cruise_line_name: 'AIDA Cruises',
                bio: 'Experienced cruise director with 5+ years in the industry. Love creating memorable experiences for guests.',
                phone: '+1-555-0123',
                instagram: 'https://instagram.com/alexthompson',
                twitter: 'https://twitter.com/alexthompson',
                facebook: 'https://facebook.com/alexthompson',
                snapchat: 'alexthompson',
                website: 'https://alexthompson.com',
                additional_photo_1: null,
                additional_photo_2: null,
                additional_photo_3: null,
                created_at: new Date().toISOString(),
                is_same_ship: false,
                connection_status: 'none' // Mock connection status
            };
            return res.json({
                success: true,
                profile: mockProfile
            });
        }
        const user = userRows[0];
        // Check if users are on the same ship
        const [currentUserRows] = await database_1.pool.execute(`
            SELECT current_ship_id FROM users WHERE id = ? AND is_active = true
        `, [currentUserId]);
        const currentUserShipId = currentUserRows[0]?.current_ship_id;
        const isSameShip = currentUserShipId === user.current_ship_id;
        // Check connection status between users
        let connectionStatus = 'none';
        // Check if they are connected
        const [connectionRows] = await database_1.pool.execute('SELECT id FROM connections WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)', [currentUserId, targetUserId, targetUserId, currentUserId]);
        if (connectionRows.length > 0) {
            connectionStatus = 'connected';
        }
        else {
            // Check for pending request
            const [requestRows] = await database_1.pool.execute('SELECT status FROM connection_requests WHERE requester_id = ? AND receiver_id = ?', [currentUserId, targetUserId]);
            if (requestRows.length > 0) {
                const request = requestRows[0];
                connectionStatus = request.status;
            }
        }
        // Prepare additional photos array
        const additionalPhotos = [];
        if (user.additional_photo_1)
            additionalPhotos.push(user.additional_photo_1);
        if (user.additional_photo_2)
            additionalPhotos.push(user.additional_photo_2);
        if (user.additional_photo_3)
            additionalPhotos.push(user.additional_photo_3);
        res.json({
            success: true,
            profile: {
                id: user.id,
                display_name: user.display_name,
                profile_photo: user.profile_photo,
                department_name: user.department_name,
                subcategory_name: user.subcategory_name,
                role_name: user.role_name,
                ship_name: user.ship_name,
                cruise_line_name: user.cruise_line_name,
                bio: user.bio,
                phone: user.phone,
                instagram: user.instagram,
                twitter: user.twitter,
                facebook: user.facebook,
                snapchat: user.snapchat,
                website: user.website,
                additional_photos: additionalPhotos,
                created_at: user.created_at,
                is_same_ship: isSameShip,
                connection_status: connectionStatus
            }
        });
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        console.error('Error details:', {
            message: error?.message || 'Unknown error',
            stack: error?.stack || 'No stack trace',
            targetUserId: req.params.userId
        });
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});
exports.default = router;
//# sourceMappingURL=crew.js.map