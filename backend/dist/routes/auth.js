"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
// POST /api/auth/register
router.post('/register', authController_1.registerValidation, authController_1.register);
// POST /api/auth/login
router.post('/login', authController_1.loginValidation, authController_1.login);
// GET /api/auth/verify/:token
router.get('/verify/:token', authController_1.verifyEmail);
// POST /api/auth/resend-verification
router.post('/resend-verification', authController_1.resendVerification);
exports.default = router;
//# sourceMappingURL=auth.js.map