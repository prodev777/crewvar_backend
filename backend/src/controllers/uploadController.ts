import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use a single uploads directory for now
    const uploadPath = path.join(__dirname, '../../uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    console.log('Multer destination:', uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload profile photo
export const uploadProfilePhoto = async (req: Request, res: Response) => {
  try {
    console.log('Upload profile photo request received');
    console.log('File:', req.file);
    console.log('User:', (req as any).user);
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = (req as any).user.userId;
    const fileUrl = `/uploads/${req.file.filename}`;

    console.log('Updating database for user:', userId, 'with file:', fileUrl);

    // Update user's profile photo in database
    const pool = require('../config/database').pool;
    await pool.execute(
      'UPDATE users SET profile_photo = ? WHERE id = ?',
      [fileUrl, userId]
    );

    console.log('Profile photo uploaded successfully');

    res.json({
      message: 'Profile photo uploaded successfully',
      fileUrl: fileUrl,
      filename: req.file.filename
    });

  } catch (error) {
    console.error('Upload profile photo error:', error);
    
    // Clean up uploaded file if database update fails
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload additional photos (for Level 2 profiles)
export const uploadAdditionalPhoto = async (req: Request, res: Response) => {
  try {
    console.log('Upload additional photo request received');
    console.log('Headers:', req.headers);
    console.log('File:', req.file);
    console.log('User:', (req as any).user);
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!(req as any).user) {
      console.log('No user in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = (req as any).user.userId;
    const fileUrl = `/uploads/${req.file.filename}`;

    console.log('Processing additional photo for user:', userId, 'with file:', fileUrl);

    // Get the photo slot index from the request body
    const { photoSlot } = req.body;
    
    console.log('Request body:', req.body);
    console.log('Photo slot requested:', photoSlot);

    // Check how many additional photos user already has
    const pool = require('../config/database').pool;
    const [existingPhotos] = await pool.execute(
      'SELECT additional_photo_1, additional_photo_2, additional_photo_3 FROM users WHERE id = ?',
      [userId]
    );

    const user = (existingPhotos as any[])[0];
    console.log('Existing photos:', user);
    
    let photoColumn = null;

    // Determine which photo slot to use
    if (photoSlot !== undefined && photoSlot !== null) {
      // User specified a specific slot
      const slotNumber = parseInt(photoSlot);
      if (slotNumber >= 1 && slotNumber <= 3) {
        photoColumn = `additional_photo_${slotNumber}`;
        console.log('Using specified slot:', photoColumn);
      } else {
        return res.status(400).json({ error: 'Invalid photo slot number. Must be 1, 2, or 3.' });
      }
    } else {
      // Find next available photo slot
      if (!user.additional_photo_1) {
        photoColumn = 'additional_photo_1';
      } else if (!user.additional_photo_2) {
        photoColumn = 'additional_photo_2';
      } else if (!user.additional_photo_3) {
        photoColumn = 'additional_photo_3';
      } else {
        return res.status(400).json({ error: 'Maximum 3 additional photos allowed' });
      }
      console.log('Using next available slot:', photoColumn);
    }

    // Update the photo column
    await pool.execute(
      `UPDATE users SET ${photoColumn} = ? WHERE id = ?`,
      [fileUrl, userId]
    );

    res.json({
      message: 'Additional photo uploaded successfully',
      fileUrl: fileUrl,
      filename: req.file.filename,
      photoSlot: photoColumn
    });

  } catch (error) {
    console.error('Upload additional photo error:', error);
    
    // Clean up uploaded file if database update fails
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete photo
export const deletePhoto = async (req: Request, res: Response) => {
  try {
    const { photoType } = req.params; // 'profile' or 'additional'
    const { photoSlot } = req.body; // For additional photos: '1', '2', or '3'
    const userId = (req as any).user.userId;

    const pool = require('../config/database').pool;

    if (photoType === 'profile') {
      // Get current profile photo
      const [userRows] = await pool.execute(
        'SELECT profile_photo FROM users WHERE id = ?',
        [userId]
      );
      
      const user = (userRows as any[])[0];
      if (user.profile_photo) {
        // Delete file from filesystem
        const filePath = path.join(__dirname, '../../', user.profile_photo);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        // Update database
        await pool.execute(
          'UPDATE users SET profile_photo = NULL WHERE id = ?',
          [userId]
        );
      }
    } else if (photoType === 'additional' && photoSlot) {
      const columnName = `additional_photo_${photoSlot}`;
      
      // Get current photo
      const [userRows] = await pool.execute(
        `SELECT ${columnName} FROM users WHERE id = ?`,
        [userId]
      );
      
      const user = (userRows as any[])[0];
      if (user[columnName]) {
        // Delete file from filesystem
        const filePath = path.join(__dirname, '../../', user[columnName]);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        // Update database
        await pool.execute(
          `UPDATE users SET ${columnName} = NULL WHERE id = ?`,
          [userId]
        );
      }
    }

    res.json({ message: 'Photo deleted successfully' });

  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

