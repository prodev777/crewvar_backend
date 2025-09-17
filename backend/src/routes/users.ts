import express from 'express';
import { getUserProfile, updateUserProfile, updateProfileDetails, updateShipAssignment, updateProfileValidation, updateProfileDetailsValidation, getUserById } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// GET /api/users/profile - Get current user's profile
router.get('/profile', authenticateToken, getUserProfile);

// PUT /api/users/profile - Update current user's profile
router.put('/profile', authenticateToken, updateProfileValidation, updateUserProfile);

// PUT /api/users/profile-details - Update profile details (bio, contacts, social media)
router.put('/profile-details', authenticateToken, updateProfileDetailsValidation, updateProfileDetails);

// PUT /api/users/ship-assignment - Update only ship assignment
router.put('/ship-assignment', authenticateToken, updateShipAssignment);

// GET /api/users/:userId - Get other user's profile by ID
router.get('/:userId', authenticateToken, getUserById);

export default router;
