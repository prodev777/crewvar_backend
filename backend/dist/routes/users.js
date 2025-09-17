"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// GET /api/users/profile - Get current user's profile
router.get('/profile', auth_1.authenticateToken, userController_1.getUserProfile);
// PUT /api/users/profile - Update current user's profile
router.put('/profile', auth_1.authenticateToken, userController_1.updateProfileValidation, userController_1.updateUserProfile);
// PUT /api/users/profile-details - Update profile details (bio, contacts, social media)
router.put('/profile-details', auth_1.authenticateToken, userController_1.updateProfileDetailsValidation, userController_1.updateProfileDetails);
// PUT /api/users/ship-assignment - Update only ship assignment
router.put('/ship-assignment', auth_1.authenticateToken, userController_1.updateShipAssignment);
// GET /api/users/:userId - Get other user's profile by ID
router.get('/:userId', auth_1.authenticateToken, userController_1.getUserById);
exports.default = router;
//# sourceMappingURL=users.js.map