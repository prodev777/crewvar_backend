"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const notificationController_1 = require("../controllers/notificationController");
const router = express_1.default.Router();
// GET /api/notifications - Get user's notifications
router.get('/', auth_1.authenticateToken, notificationController_1.getNotifications);
// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', auth_1.authenticateToken, notificationController_1.getUnreadNotificationCount);
// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put('/:notificationId/read', auth_1.authenticateToken, notificationController_1.markNotificationAsRead);
// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', auth_1.authenticateToken, notificationController_1.markAllNotificationsAsRead);
// DELETE /api/notifications/:notificationId - Delete notification
router.delete('/:notificationId', auth_1.authenticateToken, notificationController_1.deleteNotification);
// GET /api/notifications/preferences - Get notification preferences
router.get('/preferences', auth_1.authenticateToken, notificationController_1.getNotificationPreferences);
// PUT /api/notifications/preferences - Update notification preferences
router.put('/preferences', auth_1.authenticateToken, notificationController_1.updateNotificationPreferences);
// POST /api/notifications/test - Create test notification
router.post('/test', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type, title, message, data } = req.body;
        const { createNotification } = await Promise.resolve().then(() => __importStar(require('../controllers/notificationController')));
        await createNotification(userId, type || 'system', title || 'Test Notification', message || 'This is a test notification', data);
        res.json({ message: 'Test notification created successfully' });
    }
    catch (error) {
        console.error('Create test notification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map