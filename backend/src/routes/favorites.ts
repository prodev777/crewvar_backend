import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getFavorites,
    addFavorite,
    removeFavorite,
    checkFavoriteStatus,
    getFavoriteAlerts,
    getUnreadAlertsCount,
    markAlertAsRead
} from '../controllers/favoritesController';

const router = express.Router();

// GET /api/favorites - Get user's favorites
router.get('/', authenticateToken, getFavorites);

// POST /api/favorites - Add user to favorites
router.post('/', authenticateToken, addFavorite);

// DELETE /api/favorites/:favoriteUserId - Remove user from favorites
router.delete('/:favoriteUserId', authenticateToken, removeFavorite);

// GET /api/favorites/status/:favoriteUserId - Check if user is favorite
router.get('/status/:favoriteUserId', authenticateToken, checkFavoriteStatus);

// GET /api/favorites/alerts - Get favorite alerts
router.get('/alerts', authenticateToken, getFavoriteAlerts);

// GET /api/favorites/alerts/unread-count - Get unread alerts count
router.get('/alerts/unread-count', authenticateToken, getUnreadAlertsCount);

// PUT /api/favorites/alerts/:alertId/read - Mark alert as read
router.put('/alerts/:alertId/read', authenticateToken, markAlertAsRead);

export default router;
