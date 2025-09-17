import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { upload, uploadProfilePhoto, uploadAdditionalPhoto, deletePhoto } from '../controllers/uploadController';

const router = express.Router();

// Upload profile photo
router.post('/profile-photo', 
  authenticateToken, 
  upload.single('file'), 
  uploadProfilePhoto
);

// Upload additional photo (for Level 2 profiles)
router.post('/additional-photo', 
  authenticateToken, 
  upload.single('file'), 
  uploadAdditionalPhoto
);

// Delete photo
router.delete('/photo/:photoType', 
  authenticateToken, 
  deletePhoto
);

export default router;
