"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const uploadController_1 = require("../controllers/uploadController");
const router = express_1.default.Router();
// Upload profile photo
router.post('/profile-photo', auth_1.authenticateToken, uploadController_1.upload.single('file'), uploadController_1.uploadProfilePhoto);
// Upload additional photo (for Level 2 profiles)
router.post('/additional-photo', auth_1.authenticateToken, uploadController_1.upload.single('file'), uploadController_1.uploadAdditionalPhoto);
// Delete photo
router.delete('/photo/:photoType', auth_1.authenticateToken, uploadController_1.deletePhoto);
exports.default = router;
//# sourceMappingURL=upload.js.map