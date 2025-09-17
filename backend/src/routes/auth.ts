import express from 'express';
import { 
  register, 
  login, 
  verifyEmail, 
  resendVerification,
  registerValidation,
  loginValidation 
} from '../controllers/authController';

const router = express.Router();

// POST /api/auth/register
router.post('/register', registerValidation, register);

// POST /api/auth/login
router.post('/login', loginValidation, login);

// GET /api/auth/verify/:token
router.get('/verify/:token', verifyEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', resendVerification);

export default router;
