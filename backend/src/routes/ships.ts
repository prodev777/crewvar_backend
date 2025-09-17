import express from 'express';
import { optionalAuth } from '../middleware/auth';

const router = express.Router();

// GET /api/ships
router.get('/', optionalAuth, (req, res) => {
  res.json({ message: 'Ships endpoint' });
});

export default router;
