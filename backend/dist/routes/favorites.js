"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const favoritesController_1 = require("../controllers/favoritesController");
const router = express_1.default.Router();
// GET /api/favorites - Get user's favorites
router.get('/', auth_1.authenticateToken, favoritesController_1.getFavorites);
// POST /api/favorites - Add user to favorites
router.post('/', auth_1.authenticateToken, favoritesController_1.addFavorite);
// DELETE /api/favorites/:favoriteUserId - Remove user from favorites
router.delete('/:favoriteUserId', auth_1.authenticateToken, favoritesController_1.removeFavorite);
// GET /api/favorites/status/:favoriteUserId - Check if user is favorite
router.get('/status/:favoriteUserId', auth_1.authenticateToken, favoritesController_1.checkFavoriteStatus);
// GET /api/favorites/alerts - Get favorite alerts
router.get('/alerts', auth_1.authenticateToken, favoritesController_1.getFavoriteAlerts);
// GET /api/favorites/alerts/unread-count - Get unread alerts count
router.get('/alerts/unread-count', auth_1.authenticateToken, favoritesController_1.getUnreadAlertsCount);
// PUT /api/favorites/alerts/:alertId/read - Mark alert as read
router.put('/alerts/:alertId/read', auth_1.authenticateToken, favoritesController_1.markAlertAsRead);
exports.default = router;
//# sourceMappingURL=favorites.js.map