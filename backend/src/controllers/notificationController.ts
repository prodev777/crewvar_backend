import { Request, Response } from 'express';
import pool from '../config/database';
import { io } from '../index';

// Get user's notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `
      SELECT 
        n.id, n.type, n.title, n.message, n.data, n.is_read, 
        n.created_at
      FROM notifications n
      WHERE n.user_id = ?
    `;

    const params: any[] = [userId];

    if (unreadOnly === 'true') {
      query += ' AND n.is_read = FALSE';
    }

    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), offset);

    const [rows] = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
    const countParams: any[] = [userId];

    if (unreadOnly === 'true') {
      countQuery += ' AND is_read = FALSE';
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = (countResult as any[])[0].total;

    res.json({
      notifications: rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = (req as any).user.userId;

    // Check if notification belongs to user
    const [existingRows] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = (req as any).user.userId;

    // Check if notification belongs to user
    const [existingRows] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get notification preferences
export const getNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const [rows] = await pool.execute(
      `SELECT 
        type, email_enabled, push_enabled, in_app_enabled, 
        created_at
       FROM notification_preferences 
       WHERE user_id = ?
       ORDER BY type`,
      [userId]
    );

    res.json({ preferences: rows });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
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
      await pool.execute(
        `INSERT INTO notification_preferences 
         (user_id, type, email_enabled, push_enabled, in_app_enabled, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
         email_enabled = VALUES(email_enabled),
         push_enabled = VALUES(push_enabled),
         in_app_enabled = VALUES(in_app_enabled)`,
        [
          userId,
          pref.type,
          pref.emailEnabled !== undefined ? pref.emailEnabled : true,
          pref.pushEnabled !== undefined ? pref.pushEnabled : true,
          pref.inAppEnabled !== undefined ? pref.inAppEnabled : true
        ]
      );
    }

    res.json({ message: 'Notification preferences updated successfully' });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    const count = (rows as any[])[0].count;
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread notification count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a notification (internal function, can be used by other controllers)
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any
) => {
  try {
    // Check if user has notification preferences enabled
    const [prefRows] = await pool.execute(
      'SELECT in_app_enabled FROM notification_preferences WHERE user_id = ? AND type = ?',
      [userId, type]
    );

    const preferences = (prefRows as any[])[0];
    const isEnabled = !preferences || preferences.in_app_enabled !== false; // Default to true if no preference set

    if (!isEnabled) {
      return null; // User has disabled this type of notification
    }

    const [result] = await pool.execute(
      `INSERT INTO notifications 
       (user_id, type, title, message, data, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );

    const notificationId = (result as any).insertId;
    
    // Emit WebSocket notification to the user
    try {
      console.log(`🔔 Attempting to send WebSocket notification to user ${userId} in room user-${userId}`);
      console.log(`🔔 Notification data:`, { id: notificationId, userId, type, title, message });
      
      io.to(`user-${userId}`).emit('new_notification', {
        id: notificationId,
        userId,
        type,
        title,
        message,
        data,
        createdAt: new Date().toISOString()
      });
      
      console.log(`🔔 WebSocket notification sent to user ${userId}: ${title}`);
    } catch (socketError) {
      console.error('Failed to send WebSocket notification:', socketError);
      // Don't fail the notification creation if WebSocket fails
    }

    return notificationId;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};
