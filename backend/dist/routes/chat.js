"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const chatController_1 = require("../controllers/chatController");
const router = express_1.default.Router();
// GET /api/chat/rooms - Get all chat rooms for current user
router.get('/rooms', auth_1.authenticateToken, chatController_1.getChatRooms);
// GET /api/chat/messages/:otherUserId - Get messages with a specific user
router.get('/messages/:otherUserId', auth_1.authenticateToken, chatController_1.getChatMessages);
// POST /api/chat/send - Send a message
router.post('/send', auth_1.authenticateToken, chatController_1.sendMessage);
// PUT /api/chat/message-status - Update message status (delivered/read)
router.put('/message-status', auth_1.authenticateToken, chatController_1.updateMessageStatus);
// PUT /api/chat/online-status - Update user online status
router.put('/online-status', auth_1.authenticateToken, chatController_1.updateOnlineStatus);
// GET /api/chat/user-status/:userId - Get user online status
router.get('/user-status/:userId', auth_1.authenticateToken, chatController_1.getUserOnlineStatus);
exports.default = router;
//# sourceMappingURL=chat.js.map