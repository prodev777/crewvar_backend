"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitReport = exports.performModerationAction = exports.getModerationStats = exports.getSuspiciousActivities = exports.updateReportStatus = exports.getReportById = exports.getReports = void 0;
const database_1 = __importDefault(require("../config/database"));
// Get all reports
const getReports = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Check if user is admin
        const [userRows] = await database_1.default.execute('SELECT is_admin FROM users WHERE id = ?', [userId]);
        const isAdmin = userRows[0]?.is_admin;
        if (!isAdmin) {
            return res.json({ reports: [] });
        }
        const [rows] = await database_1.default.execute(`SELECT 
        r.id, r.reporter_id, r.reported_user_id, r.report_type, r.description, 
        r.status, r.resolution, r.created_at, r.updated_at,
        u1.display_name as reporter_name,
        u2.display_name as reported_user_name
       FROM reports r
       LEFT JOIN users u1 ON r.reporter_id = u1.id
       LEFT JOIN users u2 ON r.reported_user_id = u2.id
       ORDER BY r.created_at DESC`);
        res.json({ reports: rows });
    }
    catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getReports = getReports;
// Get specific report by ID
const getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        // Check if user is admin
        const [userRows] = await database_1.default.execute('SELECT is_admin FROM users WHERE id = ?', [userId]);
        const isAdmin = userRows[0]?.is_admin;
        if (!isAdmin) {
            return res.status(404).json({ error: 'Report not found' });
        }
        const [rows] = await database_1.default.execute(`SELECT 
        r.id, r.reporter_id, r.reported_user_id, r.report_type, r.description, 
        r.status, r.resolution, r.created_at, r.updated_at,
        u1.display_name as reporter_name,
        u2.display_name as reported_user_name
       FROM reports r
       LEFT JOIN users u1 ON r.reporter_id = u1.id
       LEFT JOIN users u2 ON r.reported_user_id = u2.id
       WHERE r.id = ?`, [id]);
        const report = rows[0];
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json({ report });
    }
    catch (error) {
        console.error('Get report by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getReportById = getReportById;
// Update report status
const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolution } = req.body;
        if (!status || !['pending', 'investigating', 'resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        await database_1.default.execute('UPDATE reports SET status = ?, resolution = ?, updated_at = NOW() WHERE id = ?', [status, resolution, id]);
        res.json({ message: 'Report status updated successfully' });
    }
    catch (error) {
        console.error('Update report status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateReportStatus = updateReportStatus;
// Get suspicious activities
const getSuspiciousActivities = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Check if user is admin
        const [userRows] = await database_1.default.execute('SELECT is_admin FROM users WHERE id = ?', [userId]);
        const isAdmin = userRows[0]?.is_admin;
        if (!isAdmin) {
            return res.json({ activities: [] });
        }
        // This would typically query for suspicious patterns like:
        // - Multiple failed login attempts
        // - Unusual connection patterns
        // - Spam-like behavior
        // For now, we'll return an empty array
        const activities = [];
        res.json({ activities });
    }
    catch (error) {
        console.error('Get suspicious activities error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getSuspiciousActivities = getSuspiciousActivities;
// Get moderation statistics
const getModerationStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Check if user is admin
        const [userRows] = await database_1.default.execute('SELECT is_admin FROM users WHERE id = ?', [userId]);
        const isAdmin = userRows[0]?.is_admin;
        if (!isAdmin) {
            return res.json({
                stats: {
                    totalReports: 0,
                    pendingReports: 0,
                    resolvedReports: 0,
                    totalActions: 0,
                    warnings: 0,
                    temporaryBans: 0,
                    permanentBans: 0
                }
            });
        }
        const [reportStats] = await database_1.default.execute(`SELECT 
        status,
        COUNT(*) as count
       FROM reports 
       GROUP BY status`);
        const [actionStats] = await database_1.default.execute(`SELECT 
        action_type,
        COUNT(*) as count
       FROM moderation_actions 
       GROUP BY action_type`);
        const stats = {
            totalReports: reportStats.reduce((sum, row) => sum + row.count, 0),
            pendingReports: reportStats.find(row => row.status === 'pending')?.count || 0,
            resolvedReports: reportStats.find(row => row.status === 'resolved')?.count || 0,
            totalActions: actionStats.reduce((sum, row) => sum + row.count, 0),
            warnings: actionStats.find(row => row.action_type === 'warning')?.count || 0,
            temporaryBans: actionStats.find(row => row.action_type === 'temporary_ban')?.count || 0,
            permanentBans: actionStats.find(row => row.action_type === 'permanent_ban')?.count || 0
        };
        res.json({ stats });
    }
    catch (error) {
        console.error('Get moderation stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getModerationStats = getModerationStats;
// Perform moderation action
const performModerationAction = async (req, res) => {
    try {
        const { reportId, actionType, targetUserId, reason, isActive } = req.body;
        if (!actionType || !targetUserId || !reason) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (!['warning', 'temporary_ban', 'permanent_ban'].includes(actionType)) {
            return res.status(400).json({ error: 'Invalid action type' });
        }
        const moderatorId = req.user.userId;
        // Insert moderation action
        await database_1.default.execute(`INSERT INTO moderation_actions 
       (report_id, moderator_id, target_user_id, action_type, reason, is_active, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`, [reportId, moderatorId, targetUserId, actionType, reason, isActive]);
        // Update user status if it's a ban
        if (actionType === 'temporary_ban' || actionType === 'permanent_ban') {
            const banDuration = actionType === 'temporary_ban' ? 7 : null; // 7 days for temp ban
            await database_1.default.execute('UPDATE users SET is_banned = 1, ban_expires_at = ? WHERE id = ?', [banDuration ? new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000) : null, targetUserId]);
        }
        // Update report status to resolved
        if (reportId) {
            await database_1.default.execute('UPDATE reports SET status = ?, resolution = ?, updated_at = NOW() WHERE id = ?', ['resolved', `Action taken: ${actionType}`, reportId]);
        }
        res.json({ message: 'Moderation action performed successfully' });
    }
    catch (error) {
        console.error('Perform moderation action error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.performModerationAction = performModerationAction;
// Submit a new report
const submitReport = async (req, res) => {
    try {
        const { reportedUserId, reportType, description } = req.body;
        const reporterId = req.user.userId;
        if (!reportedUserId || !reportType || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (!['spam', 'harassment', 'inappropriate_content', 'fake_profile', 'other'].includes(reportType)) {
            return res.status(400).json({ error: 'Invalid report type' });
        }
        await database_1.default.execute(`INSERT INTO reports 
       (reporter_id, reported_user_id, report_type, description, status, created_at) 
       VALUES (?, ?, ?, ?, 'pending', NOW())`, [reporterId, reportedUserId, reportType, description]);
        res.json({ message: 'Report submitted successfully' });
    }
    catch (error) {
        console.error('Submit report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.submitReport = submitReport;
//# sourceMappingURL=moderationController.js.map