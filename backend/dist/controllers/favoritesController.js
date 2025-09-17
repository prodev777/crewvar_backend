"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAlertAsRead = exports.getUnreadAlertsCount = exports.getFavoriteAlerts = exports.checkFavoriteStatus = exports.removeFavorite = exports.addFavorite = exports.getFavorites = void 0;
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
// Get user's favorites
const getFavorites = async (req, res) => {
    try {
        const userId = req.user?.userId;
        console.log('📋 GET FAVORITES REQUEST for user:', userId);
        const [favoritesRows] = await database_1.pool.execute(`
            SELECT 
                f.id,
                f.user_id,
                f.favorite_user_id,
                f.created_at,
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
            FROM favorites f
            JOIN users u ON f.favorite_user_id = u.id
            LEFT JOIN ships s ON u.current_ship_id = s.id
            LEFT JOIN cruise_lines cl ON s.cruise_line_id = cl.id
            LEFT JOIN departments d ON CONCAT('dept-', u.department_id) = d.id
            LEFT JOIN subcategories sc ON u.subcategory_id = sc.id
            LEFT JOIN roles r ON CONCAT('role-', u.role_id) = r.id
            WHERE f.user_id = ? AND u.is_active = true
            ORDER BY f.created_at DESC
        `, [userId]);
        const favorites = favoritesRows.map(row => ({
            id: row.id,
            userId: row.user_id,
            favoriteUserId: row.favorite_user_id,
            createdAt: row.created_at,
            favoriteUser: {
                id: row.favorite_user_id,
                displayName: row.display_name,
                profilePhoto: row.profile_photo,
                role: row.role_name,
                department: row.department_name,
                shipName: row.ship_name,
                cruiseLine: row.cruise_line_name
            }
        }));
        console.log('Found favorites:', favorites.length);
        res.json({
            success: true,
            favorites,
            total: favorites.length
        });
    }
    catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
};
exports.getFavorites = getFavorites;
// Add user to favorites
const addFavorite = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { favoriteUserId } = req.body;
        if (!favoriteUserId) {
            return res.status(400).json({ error: 'favoriteUserId is required' });
        }
        if (userId === favoriteUserId) {
            return res.status(400).json({ error: 'Cannot add yourself to favorites' });
        }
        console.log('⭐ ADD FAVORITE REQUEST:', { userId, favoriteUserId });
        // Check if already exists
        const [existingRows] = await database_1.pool.execute(`
            SELECT id FROM favorites 
            WHERE user_id = ? AND favorite_user_id = ?
        `, [userId, favoriteUserId]);
        if (existingRows.length > 0) {
            return res.status(400).json({ error: 'User is already in favorites' });
        }
        // Check if favorite user exists and is active
        const [userRows] = await database_1.pool.execute(`
            SELECT id, display_name FROM users 
            WHERE id = ? AND is_active = true
        `, [favoriteUserId]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const favoriteId = (0, uuid_1.v4)();
        await database_1.pool.execute(`
            INSERT INTO favorites (id, user_id, favorite_user_id, created_at)
            VALUES (?, ?, ?, NOW())
        `, [favoriteId, userId, favoriteUserId]);
        console.log('✅ Added to favorites:', favoriteUserId);
        res.json({
            success: true,
            message: 'Added to favorites successfully',
            favoriteId
        });
    }
    catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ error: 'Failed to add favorite' });
    }
};
exports.addFavorite = addFavorite;
// Remove user from favorites
const removeFavorite = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { favoriteUserId } = req.params;
        console.log('🗑️ REMOVE FAVORITE REQUEST:', { userId, favoriteUserId });
        const [result] = await database_1.pool.execute(`
            DELETE FROM favorites 
            WHERE user_id = ? AND favorite_user_id = ?
        `, [userId, favoriteUserId]);
        const affectedRows = result.affectedRows;
        if (affectedRows === 0) {
            return res.status(404).json({ error: 'Favorite not found' });
        }
        console.log('✅ Removed from favorites:', favoriteUserId);
        res.json({
            success: true,
            message: 'Removed from favorites successfully'
        });
    }
    catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
};
exports.removeFavorite = removeFavorite;
// Check if user is favorite
const checkFavoriteStatus = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { favoriteUserId } = req.params;
        const [rows] = await database_1.pool.execute(`
            SELECT id FROM favorites 
            WHERE user_id = ? AND favorite_user_id = ?
        `, [userId, favoriteUserId]);
        const isFavorite = rows.length > 0;
        res.json({
            success: true,
            isFavorite
        });
    }
    catch (error) {
        console.error('Error checking favorite status:', error);
        res.status(500).json({ error: 'Failed to check favorite status' });
    }
};
exports.checkFavoriteStatus = checkFavoriteStatus;
// Get favorite alerts (mock implementation for now)
const getFavoriteAlerts = async (req, res) => {
    try {
        const userId = req.user?.userId;
        console.log('🔔 GET FAVORITE ALERTS REQUEST for user:', userId);
        // For now, return empty alerts array
        // In a real implementation, this would check for same ship/port alerts
        const alerts = [];
        res.json({
            success: true,
            alerts,
            total: alerts.length
        });
    }
    catch (error) {
        console.error('Error fetching favorite alerts:', error);
        res.status(500).json({ error: 'Failed to fetch favorite alerts' });
    }
};
exports.getFavoriteAlerts = getFavoriteAlerts;
// Get unread alerts count
const getUnreadAlertsCount = async (req, res) => {
    try {
        const userId = req.user?.userId;
        // For now, return 0
        // In a real implementation, this would count unread alerts
        res.json({
            success: true,
            count: 0
        });
    }
    catch (error) {
        console.error('Error fetching unread alerts count:', error);
        res.status(500).json({ error: 'Failed to fetch unread alerts count' });
    }
};
exports.getUnreadAlertsCount = getUnreadAlertsCount;
// Mark alert as read
const markAlertAsRead = async (req, res) => {
    try {
        const { alertId } = req.params;
        console.log('✅ MARK ALERT AS READ REQUEST:', alertId);
        // For now, just return success
        // In a real implementation, this would update the alert status
        res.json({
            success: true,
            message: 'Alert marked as read'
        });
    }
    catch (error) {
        console.error('Error marking alert as read:', error);
        res.status(500).json({ error: 'Failed to mark alert as read' });
    }
};
exports.markAlertAsRead = markAlertAsRead;
//# sourceMappingURL=favoritesController.js.map