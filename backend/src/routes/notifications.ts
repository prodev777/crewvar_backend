import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  getUnreadNotificationCount
} from '../controllers/notificationController';

const router = express.Router();

// GET /api/notifications - Get user's notifications
router.get('/', authenticateToken, getNotifications);

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', authenticateToken, getUnreadNotificationCount);

// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put('/:notificationId/read', authenticateToken, markNotificationAsRead);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authenticateToken, markAllNotificationsAsRead);

// DELETE /api/notifications/:notificationId - Delete notification
router.delete('/:notificationId', authenticateToken, deleteNotification);

// GET /api/notifications/preferences - Get notification preferences
router.get('/preferences', authenticateToken, getNotificationPreferences);

// PUT /api/notifications/preferences - Update notification preferences
router.put('/preferences', authenticateToken, updateNotificationPreferences);

// POST /api/notifications/test - Create test notification
router.post('/test', authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const { type, title, message, data } = req.body;

        const { createNotification } = await import('../controllers/notificationController');
        
        await createNotification(
            userId,
            type || 'system',
            title || 'Test Notification',
            message || 'This is a test notification',
            data
        );

        res.json({ message: 'Test notification created successfully' });
    } catch (error) {
        console.error('Create test notification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
