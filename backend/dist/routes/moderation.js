"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const moderationController_1 = require("../controllers/moderationController");
const router = express_1.default.Router();
// GET /api/moderation/reports - Get all reports (admin only, returns empty for regular users)
router.get('/reports', auth_1.authenticateToken, moderationController_1.getReports);
// GET /api/moderation/reports/:id - Get specific report (admin only, returns empty for regular users)
router.get('/reports/:id', auth_1.authenticateToken, moderationController_1.getReportById);
// PUT /api/moderation/reports/:id/status - Update report status (admin only)
router.put('/reports/:id/status', auth_1.authenticateToken, auth_1.requireAdmin, moderationController_1.updateReportStatus);
// GET /api/moderation/suspicious - Get suspicious activities (admin only, returns empty for regular users)
router.get('/suspicious', auth_1.authenticateToken, moderationController_1.getSuspiciousActivities);
// GET /api/moderation/stats - Get moderation statistics (admin only, returns empty for regular users)
router.get('/stats', auth_1.authenticateToken, moderationController_1.getModerationStats);
// POST /api/moderation/actions - Perform moderation action (admin only)
router.post('/actions', auth_1.authenticateToken, auth_1.requireAdmin, moderationController_1.performModerationAction);
// POST /api/moderation/reports - Submit a new report
router.post('/reports', auth_1.authenticateToken, moderationController_1.submitReport);
exports.default = router;
//# sourceMappingURL=moderation.js.map