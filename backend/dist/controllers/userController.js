"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.updateProfileDetailsValidation = exports.updateShipAssignment = exports.updateProfileValidation = exports.updateProfileDetails = exports.updateUserProfile = exports.getUserProfile = void 0;
const express_validator_1 = require("express-validator");
const database_1 = __importDefault(require("../config/database"));
// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [rows] = await database_1.default.execute(`SELECT id, email, display_name, profile_photo, bio, phone, instagram, twitter, 
              facebook, snapchat, website, additional_photo_1, additional_photo_2, additional_photo_3,
              department_id, subcategory_id, role_id, current_ship_id, is_email_verified, created_at, updated_at 
       FROM users WHERE id = ?`, [userId]);
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Debug profile photo data
        if (user.profile_photo) {
            console.log('Profile photo data length:', user.profile_photo.length);
            console.log('Profile photo starts with:', user.profile_photo.substring(0, 50));
            console.log('Profile photo ends with:', user.profile_photo.substring(user.profile_photo.length - 50));
        }
        else {
            console.log('No profile photo data found');
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUserProfile = getUserProfile;
// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userId = req.user.userId;
        const { displayName, profilePhoto, departmentId, subcategoryId, roleId, currentShipId } = req.body;
        // Log the data being sent (without the full photo)
        console.log('Updating profile for user:', userId);
        console.log('Profile data:', {
            displayName,
            departmentId,
            subcategoryId,
            roleId,
            currentShipId,
            profilePhotoSize: profilePhoto ? profilePhoto.length : 0
        });
        await database_1.default.execute(`UPDATE users SET 
        display_name = ?, 
        profile_photo = ?, 
        department_id = ?, 
        subcategory_id = ?, 
        role_id = ?, 
        current_ship_id = ?,
        updated_at = NOW()
       WHERE id = ?`, [displayName, profilePhoto, departmentId, subcategoryId, roleId, currentShipId, userId]);
        console.log('Profile updated successfully for user:', userId);
        res.json({ message: 'Profile updated successfully' });
    }
    catch (error) {
        console.error('Update user profile error:', error);
        // Check if it's a packet size error
        if (error.code === 'ER_NET_PACKET_TOO_LARGE') {
            console.error('Profile photo is too large. Consider compressing the image.');
            res.status(413).json({
                error: 'Profile photo is too large. Please choose a smaller image.'
            });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
exports.updateUserProfile = updateUserProfile;
// Update profile details (bio, contacts, social media)
const updateProfileDetails = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bio, phone, instagram, twitter, facebook, snapchat, website, additionalPhotos } = req.body;
        console.log('Updating profile details for user:', userId);
        console.log('Profile details data:', {
            bio: bio ? bio.substring(0, 100) + '...' : null,
            phone,
            instagram,
            twitter,
            facebook,
            snapchat,
            website,
            additionalPhotosCount: additionalPhotos ? additionalPhotos.length : 0
        });
        await database_1.default.execute(`UPDATE users SET 
        bio = ?, 
        phone = ?, 
        instagram = ?, 
        twitter = ?, 
        facebook = ?, 
        snapchat = ?, 
        website = ?,
        additional_photo_1 = ?,
        additional_photo_2 = ?,
        additional_photo_3 = ?,
        updated_at = NOW()
       WHERE id = ?`, [
            bio,
            phone,
            instagram,
            twitter,
            facebook,
            snapchat,
            website,
            additionalPhotos?.[0] || null,
            additionalPhotos?.[1] || null,
            additionalPhotos?.[2] || null,
            userId
        ]);
        console.log('Profile details updated successfully for user:', userId);
        res.json({ message: 'Profile details updated successfully' });
    }
    catch (error) {
        console.error('Update profile details error:', error?.message, error?.stack);
        // Handle specific MySQL packet size errors
        if (error?.message?.includes('max_allowed_packet')) {
            console.error('Packet size error - image data too large');
            res.status(413).json({
                error: 'Image data is too large. Please use smaller images or compress them more.'
            });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
exports.updateProfileDetails = updateProfileDetails;
// Validation rules
exports.updateProfileValidation = [
    (0, express_validator_1.body)('displayName').isLength({ min: 2 }).withMessage('Display name must be at least 2 characters'),
    (0, express_validator_1.body)('departmentId').notEmpty().withMessage('Department is required'),
    (0, express_validator_1.body)('subcategoryId').notEmpty().withMessage('Subcategory is required'),
    (0, express_validator_1.body)('roleId').notEmpty().withMessage('Role is required'),
    (0, express_validator_1.body)('currentShipId').notEmpty().withMessage('Current ship is required')
];
// Update only ship assignment
const updateShipAssignment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentShipId } = req.body;
        if (!currentShipId) {
            return res.status(400).json({ error: 'Current ship ID is required' });
        }
        console.log('Updating ship assignment for user:', userId, 'to ship:', currentShipId);
        await database_1.default.execute(`UPDATE users SET 
        current_ship_id = ?,
        updated_at = NOW()
       WHERE id = ?`, [currentShipId, userId]);
        console.log('Ship assignment updated successfully for user:', userId);
        res.json({ message: 'Ship assignment updated successfully' });
    }
    catch (error) {
        console.error('Update ship assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateShipAssignment = updateShipAssignment;
exports.updateProfileDetailsValidation = [
    (0, express_validator_1.body)('bio').optional().isLength({ max: 1000 }).withMessage('Bio must be less than 1000 characters'),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    (0, express_validator_1.body)('instagram').optional().isURL().withMessage('Invalid Instagram URL'),
    (0, express_validator_1.body)('twitter').optional().isURL().withMessage('Invalid Twitter URL'),
    (0, express_validator_1.body)('facebook').optional().isURL().withMessage('Invalid Facebook URL'),
    (0, express_validator_1.body)('snapchat').optional().isLength({ max: 50 }).withMessage('Invalid Snapchat username'),
    (0, express_validator_1.body)('website').optional().isURL().withMessage('Invalid website URL'),
    (0, express_validator_1.body)('additionalPhotos').optional().isArray().withMessage('Additional photos must be an array'),
    (0, express_validator_1.body)('additionalPhotos.*').optional().isString().withMessage('Each additional photo must be a string')
];
// Get user profile by ID (for viewing other users' profiles)
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;
        // Get user profile with department, subcategory, role, and ship information
        const [rows] = await database_1.default.execute(`SELECT 
        u.id, u.email, u.display_name, u.profile_photo, u.bio, u.phone, 
        u.instagram, u.twitter, u.facebook, u.snapchat, u.website,
        u.additional_photo_1, u.additional_photo_2, u.additional_photo_3,
        u.department_id, u.subcategory_id, u.role_id, u.current_ship_id,
        u.is_email_verified, u.created_at, u.updated_at,
        d.name as department_name,
        sc.name as subcategory_name,
        r.name as role_name,
        s.name as ship_name,
        cl.name as cruise_line_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN subcategories sc ON u.subcategory_id = sc.id
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN ships s ON u.current_ship_id = s.id
       LEFT JOIN cruise_lines cl ON s.cruise_line_id = cl.id
       WHERE u.id = ?`, [userId]);
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Check connection status between current user and target user
        const [connectionRows] = await database_1.default.execute(`SELECT status FROM connections 
       WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)`, [currentUserId, userId, userId, currentUserId]);
        const connection = connectionRows[0];
        const connectionStatus = connection ? connection.status : 'none';
        // Check if there's a pending connection request
        const [requestRows] = await database_1.default.execute(`SELECT id, status FROM connection_requests 
       WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)`, [currentUserId, userId, userId, currentUserId]);
        const request = requestRows[0];
        const requestStatus = request ? request.status : 'none';
        res.json({
            user: {
                ...user,
                connectionStatus,
                requestStatus: requestStatus === 'none' ? 'none' : requestStatus
            }
        });
    }
    catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUserById = getUserById;
//# sourceMappingURL=userController.js.map