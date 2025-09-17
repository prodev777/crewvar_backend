"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidation = exports.registerValidation = exports.resendVerification = exports.verifyEmail = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_validator_1 = require("express-validator");
const database_1 = __importDefault(require("../config/database"));
const email_1 = require("../utils/email");
const jwt_1 = require("../utils/jwt");
// Register user
const register = async (req, res) => {
    try {
        // Debug: Check if environment variables are loaded
        console.log('🔍 Environment check:');
        console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('- DB_HOST:', process.env.DB_HOST);
        console.log('- DB_NAME:', process.env.DB_NAME);
        // Validate input
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password, fullName } = req.body;
        // Check if user already exists
        const [existingUsers] = await database_1.default.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }
        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcryptjs_1.default.hash(password, saltRounds);
        // Generate verification token
        const verificationToken = (0, jwt_1.generateToken)({ email }, '24h');
        // Create user
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await database_1.default.execute(`INSERT INTO users (id, email, password_hash, display_name, verification_token, verification_token_expires) 
       VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`, [userId, email, passwordHash, fullName, verificationToken]);
        // Send verification email (skip for now - email not configured)
        try {
            await (0, email_1.sendVerificationEmail)(email, verificationToken);
            console.log('✅ Verification email sent successfully');
        }
        catch (emailError) {
            console.log('⚠️ Email sending failed (this is OK for testing):', emailError.message);
            // Don't throw the error - registration should still succeed
        }
        res.status(201).json({
            message: 'User registered successfully. Email verification skipped for testing.',
            userId
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = register;
// Login user
const login = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        // Find user
        const [users] = await database_1.default.execute('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [email]);
        const user = users[0];
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Check password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Skip email verification for testing
        // if (!user.is_email_verified) {
        //   return res.status(401).json({ error: 'Please verify your email before logging in' });
        // }
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            isAdmin: user.is_admin
        });
        // Update last login
        await database_1.default.execute('UPDATE users SET updated_at = NOW() WHERE id = ?', [user.id]);
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                avatarUrl: user.avatar_url,
                department: user.department,
                role: user.role,
                isAdmin: user.is_admin
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
// Verify email
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        // Verify token
        const decoded = (0, jwt_1.verifyToken)(token);
        // Update user verification status
        const [result] = await database_1.default.execute('UPDATE users SET is_email_verified = TRUE, verification_token = NULL WHERE email = ? AND verification_token = ?', [decoded.email, token]);
        if (result.affectedRows === 0) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }
        res.json({ message: 'Email verified successfully' });
    }
    catch (error) {
        console.error('Email verification error:', error);
        res.status(400).json({ error: 'Invalid or expired verification token' });
    }
};
exports.verifyEmail = verifyEmail;
// Resend verification email
const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        // Find user
        const [users] = await database_1.default.execute('SELECT * FROM users WHERE email = ? AND is_email_verified = FALSE', [email]);
        const user = users[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found or already verified' });
        }
        // Generate new verification token
        const verificationToken = (0, jwt_1.generateToken)({ email }, '24h');
        // Update verification token
        await database_1.default.execute('UPDATE users SET verification_token = ?, verification_token_expires = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE id = ?', [verificationToken, user.id]);
        // Send verification email
        await (0, email_1.sendVerificationEmail)(email, verificationToken);
        res.json({ message: 'Verification email sent successfully' });
    }
    catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.resendVerification = resendVerification;
// Validation rules
exports.registerValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('fullName').isLength({ min: 2 }).withMessage('Full name must be at least 2 characters')
];
exports.loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')
];
//# sourceMappingURL=authController.js.map