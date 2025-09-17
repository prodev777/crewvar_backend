import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { verifyToken } from '../utils/jwt';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    isAdmin: boolean;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    const decoded = verifyToken(token);
    console.log('🔐 Token decoded successfully:', decoded);
    
    // Check if user still exists and is active
    const [users] = await pool.execute(
      'SELECT id, email, is_admin, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    const user = (users as any[])[0];
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
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      
      const [users] = await pool.execute(
        'SELECT id, email, is_admin, is_active FROM users WHERE id = ? AND is_active = TRUE',
        [decoded.userId]
      );

      const user = (users as any[])[0];
      if (user) {
        req.user = {
          userId: user.id,
          email: user.email,
          isAdmin: user.is_admin
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};
