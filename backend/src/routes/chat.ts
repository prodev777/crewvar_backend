import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getChatRooms, 
  getChatMessages, 
  sendMessage, 
  updateMessageStatus, 
  updateOnlineStatus, 
  getUserOnlineStatus 
} from '../controllers/chatController';

const router = express.Router();

// GET /api/chat/rooms - Get all chat rooms for current user
router.get('/rooms', authenticateToken, getChatRooms);

// GET /api/chat/messages/:otherUserId - Get messages with a specific user
router.get('/messages/:otherUserId', authenticateToken, getChatMessages);

// POST /api/chat/send - Send a message
router.post('/send', authenticateToken, sendMessage);

// PUT /api/chat/message-status - Update message status (delivered/read)
router.put('/message-status', authenticateToken, updateMessageStatus);

// PUT /api/chat/online-status - Update user online status
router.put('/online-status', authenticateToken, updateOnlineStatus);

// GET /api/chat/user-status/:userId - Get user online status
router.get('/user-status/:userId', authenticateToken, getUserOnlineStatus);

export default router;
