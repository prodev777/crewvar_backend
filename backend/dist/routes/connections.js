"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const connectionController_1 = require("../controllers/connectionController");
const router = express_1.default.Router();
// Send connection request
router.post('/request', auth_1.authenticateToken, connectionController_1.sendConnectionRequestValidation, connectionController_1.sendConnectionRequest);
// Get pending connection requests (received by current user)
router.get('/pending', auth_1.authenticateToken, connectionController_1.getPendingRequests);
// Respond to connection request (accept/decline)
router.post('/respond', auth_1.authenticateToken, connectionController_1.respondToConnectionRequestValidation, connectionController_1.respondToConnectionRequest);
// Get all connections for current user
router.get('/list', auth_1.authenticateToken, connectionController_1.getConnections);
// Remove connection
router.delete('/:connectionId', auth_1.authenticateToken, connectionController_1.removeConnection);
// Check connection status between current user and target user
router.get('/status/:targetUserId', auth_1.authenticateToken, connectionController_1.checkConnectionStatus);
exports.default = router;
//# sourceMappingURL=connections.js.map