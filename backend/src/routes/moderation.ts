import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { 
  getReports, 
  getReportById, 
  updateReportStatus, 
  getSuspiciousActivities,
  getModerationStats,
  performModerationAction,
  submitReport
} from '../controllers/moderationController';

const router = express.Router();

// GET /api/moderation/reports - Get all reports (admin only, returns empty for regular users)
router.get('/reports', authenticateToken, getReports);

// GET /api/moderation/reports/:id - Get specific report (admin only, returns empty for regular users)
router.get('/reports/:id', authenticateToken, getReportById);

// PUT /api/moderation/reports/:id/status - Update report status (admin only)
router.put('/reports/:id/status', authenticateToken, requireAdmin, updateReportStatus);

// GET /api/moderation/suspicious - Get suspicious activities (admin only, returns empty for regular users)
router.get('/suspicious', authenticateToken, getSuspiciousActivities);

// GET /api/moderation/stats - Get moderation statistics (admin only, returns empty for regular users)
router.get('/stats', authenticateToken, getModerationStats);

// POST /api/moderation/actions - Perform moderation action (admin only)
router.post('/actions', authenticateToken, requireAdmin, performModerationAction);

// POST /api/moderation/reports - Submit a new report
router.post('/reports', authenticateToken, submitReport);

export default router;
