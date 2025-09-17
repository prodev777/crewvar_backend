import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    sendConnectionRequest,
    getPendingRequests,
    respondToConnectionRequest,
    getConnections,
    removeConnection,
    checkConnectionStatus,
    sendConnectionRequestValidation,
    respondToConnectionRequestValidation
} from '../controllers/connectionController';

const router = express.Router();

// Send connection request
router.post('/request', authenticateToken, sendConnectionRequestValidation, sendConnectionRequest);

// Get pending connection requests (received by current user)
router.get('/pending', authenticateToken, getPendingRequests);

// Respond to connection request (accept/decline)
router.post('/respond', authenticateToken, respondToConnectionRequestValidation, respondToConnectionRequest);

// Get all connections for current user
router.get('/list', authenticateToken, getConnections);

// Remove connection
router.delete('/:connectionId', authenticateToken, removeConnection);

// Check connection status between current user and target user
router.get('/status/:targetUserId', authenticateToken, checkConnectionStatus);

export default router;