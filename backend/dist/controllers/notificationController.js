"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.getUnreadNotificationCount = exports.updateNotificationPreferences = exports.getNotificationPreferences = exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getNotifications = void 0;
const database_1 = __importDefault(require("../config/database"));
// Get user's notifications
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let query = `
      SELECT 
        n.id, n.type, n.title, n.message, n.data, n.is_read, 
        n.created_at
      FROM notifications n
      WHERE n.user_id = ?
    `;
        const params = [userId];
        if (unreadOnly === 'true') {
            query += ' AND n.is_read = FALSE';
        }
        query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        const [rows] = await database_1.default.execute(query, params);
        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
        const countParams = [userId];
        if (unreadOnly === 'true') {
            countQuery += ' AND is_read = FALSE';
        }
        const [countResult] = await database_1.default.execute(countQuery, countParams);
        const total = countResult[0].total;
        res.json({
            notifications: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getNotifications = getNotifications;
// Mark notification as read
const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.userId;
        // Check if notification belongs to user
        const [existingRows] = await database_1.default.execute('SELECT id FROM notifications WHERE id = ? AND user_id = ?', [notificationId, userId]);
        if (!Array.isArray(existingRows) || existingRows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        await database_1.default.execute('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [notificationId, userId]);
        res.json({ message: 'Notification marked as read' });
    }
    catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        await database_1.default.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [userId]);
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.userId;
        // Check if notification belongs to user
        const [existingRows] = await database_1.default.execute('SELECT id FROM notifications WHERE id = ? AND user_id = ?', [notificationId, userId]);
        if (!Array.isArray(existingRows) || existingRows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        await database_1.default.execute('DELETE FROM notifications WHERE id = ? AND user_id = ?', [notificationId, userId]);
        res.json({ message: 'Notification deleted successfully' });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteNotification = deleteNotification;
// Get notification preferences
const getNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [rows] = await database_1.default.execute(`SELECT 
        type, email_enabled, push_enabled, in_app_enabled, 
        created_at
       FROM notification_preferences 
       WHERE user_id = ?
       ORDER BY type`, [userId]);
        res.json({ preferences: rows });
    }
    catch (error) {
        console.error('Get notification preferences error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getNotificationPreferences = getNotificationPreferences;
// Update notification preferences
const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { preferences } = req.body;
        if (!Array.isArray(preferences)) {
            return res.status(400).json({ error: 'Preferences must be an array' });
        }
        // Validate preference structure
        const validTypes = ['connection_request', 'connection_accepted', 'connection_declined', 'message', 'system', 'assignment', 'port_connection', 'moderation'];
        for (const pref of preferences) {
            if (!pref.type || !validTypes.includes(pref.type)) {
                return res.status(400).json({ error: `Invalid notification type: ${pref.type}` });
            }
        }
        // Update preferences
        for (const pref of preferences) {
            await database_1.default.execute(`INSERT INTO notification_preferences 
         (user_id, type, email_enabled, push_enabled, in_app_enabled, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
         email_enabled = VALUES(email_enabled),
         push_enabled = VALUES(push_enabled),
         in_app_enabled = VALUES(in_app_enabled)`, [
                userId,
                pref.type,
                pref.emailEnabled !== undefined ? pref.emailEnabled : true,
                pref.pushEnabled !== undefined ? pref.pushEnabled : true,
                pref.inAppEnabled !== undefined ? pref.inAppEnabled : true
            ]);
        }
        res.json({ message: 'Notification preferences updated successfully' });
    }
    catch (error) {
        console.error('Update notification preferences error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateNotificationPreferences = updateNotificationPreferences;
// Get unread notification count
const getUnreadNotificationCount = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [rows] = await database_1.default.execute('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE', [userId]);
        const count = rows[0].count;
        res.json({ unreadCount: count });
    }
    catch (error) {
        console.error('Get unread notification count error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUnreadNotificationCount = getUnreadNotificationCount;
// Create a notification (internal function, can be used by other controllers)
const createNotification = async (userId, type, title, message, data) => {
    try {
        // Check if user has notification preferences enabled
        const [prefRows] = await database_1.default.execute('SELECT in_app_enabled FROM notification_preferences WHERE user_id = ? AND type = ?', [userId, type]);
        const preferences = prefRows[0];
        const isEnabled = !preferences || preferences.in_app_enabled !== false; // Default to true if no preference set
        if (!isEnabled) {
            return null; // User has disabled this type of notification
        }
        const [result] = await database_1.default.execute(`INSERT INTO notifications 
       (user_id, type, title, message, data, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`, [userId, type, title, message, data ? JSON.stringify(data) : null]);
        return result.insertId;
    }
    catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};
exports.createNotification = createNotification;
//# sourceMappingURL=notificationController.js.map