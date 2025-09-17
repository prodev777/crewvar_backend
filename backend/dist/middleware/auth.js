"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAdmin = exports.authenticateToken = void 0;
const database_1 = __importDefault(require("../config/database"));
const jwt_1 = require("../utils/jwt");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        console.log('🔐 AUTH MIDDLEWARE - URL:', req.url);
        console.log('🔐 AUTH MIDDLEWARE - Auth header:', authHeader);
        console.log('🔐 AUTH MIDDLEWARE - Token exists:', !!token);
        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({ error: 'Access token required' });
        }
        // Verify token
        console.log('🔐 Verifying token...');
        const decoded = (0, jwt_1.verifyToken)(token);
        console.log('🔐 Token decoded successfully:', decoded);
        // Check if user still exists and is active
        const [users] = await database_1.default.execute('SELECT id, email, is_admin, is_active FROM users WHERE id = ? AND is_active = TRUE', [decoded.userId]);
        const user = users[0];
        if (!user) {
            return res.status(401).json({ error: 'Invalid token or user not found' });
        }
        // Add user info to request
        req.user = {
            userId: user.id,
            email: user.email,
            isAdmin: user.is_admin
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = (0, jwt_1.verifyToken)(token);
            const [users] = await database_1.default.execute('SELECT id, email, is_admin, is_active FROM users WHERE id = ? AND is_active = TRUE', [decoded.userId]);
            const user = users[0];
            if (user) {
                req.user = {
                    userId: user.id,
                    email: user.email,
                    isAdmin: user.is_admin
                };
            }
        }
        next();
    }
    catch (error) {
        // Continue without authentication for optional auth
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map