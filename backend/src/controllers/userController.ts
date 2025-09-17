import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

// Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const [rows] = await pool.execute(
      `SELECT id, email, display_name, profile_photo, bio, phone, instagram, twitter, 
              facebook, snapchat, website, additional_photo_1, additional_photo_2, additional_photo_3,
              department_id, subcategory_id, role_id, current_ship_id, is_email_verified, created_at, updated_at 
       FROM users WHERE id = ?`,
      [userId]
    );
    
    const user = (rows as any[])[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Debug profile photo data
    if (user.profile_photo) {
      console.log('Profile photo data length:', user.profile_photo.length);
      console.log('Profile photo starts with:', user.profile_photo.substring(0, 50));
      console.log('Profile photo ends with:', user.profile_photo.substring(user.profile_photo.length - 50));
    } else {
      console.log('No profile photo data found');
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as any).user.userId;
    const { 
      displayName, 
      profilePhoto, 
      departmentId, 
      subcategoryId, 
      roleId, 
      currentShipId 
    } = req.body;

    // Log the data being sent (without the full photo)
    console.log('Updating profile for user:', userId);
    console.log('Profile data:', {
      displayName,
      departmentId,
      subcategoryId,
      roleId,
      currentShipId,
      profilePhotoSize: profilePhoto ? profilePhoto.length : 0
    });

    await pool.execute(
      `UPDATE users SET 
        display_name = ?, 
        profile_photo = ?, 
        department_id = ?, 
        subcategory_id = ?, 
        role_id = ?, 
        current_ship_id = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [displayName, profilePhoto, departmentId, subcategoryId, roleId, currentShipId, userId]
    );

    console.log('Profile updated successfully for user:', userId);
    res.json({ message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('Update user profile error:', error);
    
    // Check if it's a packet size error
    if (error.code === 'ER_NET_PACKET_TOO_LARGE') {
      console.error('Profile photo is too large. Consider compressing the image.');
      res.status(413).json({ 
        error: 'Profile photo is too large. Please choose a smaller image.' 
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Update profile details (bio, contacts, social media)
export const updateProfileDetails = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { 
      bio, 
      phone, 
      instagram, 
      twitter, 
      facebook, 
      snapchat, 
      website,
      additionalPhotos 
    } = req.body;

    console.log('Updating profile details for user:', userId);
    console.log('Profile details data:', {
      bio: bio ? bio.substring(0, 100) + '...' : null,
      phone,
      instagram,
      twitter,
      facebook,
      snapchat,
      website,
      additionalPhotosCount: additionalPhotos ? additionalPhotos.length : 0
    });

    await pool.execute(
      `UPDATE users SET 
        bio = ?, 
        phone = ?, 
        instagram = ?, 
        twitter = ?, 
        facebook = ?, 
        snapchat = ?, 
        website = ?,
        additional_photo_1 = ?,
        additional_photo_2 = ?,
        additional_photo_3 = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        bio, 
        phone, 
        instagram, 
        twitter, 
        facebook, 
        snapchat, 
        website,
        additionalPhotos?.[0] || null,
        additionalPhotos?.[1] || null,
        additionalPhotos?.[2] || null,
        userId
      ]
    );

    console.log('Profile details updated successfully for user:', userId);
    res.json({ message: 'Profile details updated successfully' });
  } catch (error: any) {
    console.error('Update profile details error:', error?.message, error?.stack);
    
    // Handle specific MySQL packet size errors
    if (error?.message?.includes('max_allowed_packet')) {
      console.error('Packet size error - image data too large');
      res.status(413).json({ 
        error: 'Image data is too large. Please use smaller images or compress them more.' 
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Validation rules
export const updateProfileValidation = [
  body('displayName').isLength({ min: 2 }).withMessage('Display name must be at least 2 characters'),
  body('departmentId').notEmpty().withMessage('Department is required'),
  body('subcategoryId').notEmpty().withMessage('Subcategory is required'),
  body('roleId').notEmpty().withMessage('Role is required'),
  body('currentShipId').notEmpty().withMessage('Current ship is required')
];

// Update only ship assignment
export const updateShipAssignment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { currentShipId } = req.body;

    if (!currentShipId) {
      return res.status(400).json({ error: 'Current ship ID is required' });
    }

    console.log('Updating ship assignment for user:', userId, 'to ship:', currentShipId);

    await pool.execute(
      `UPDATE users SET 
        current_ship_id = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [currentShipId, userId]
    );

    console.log('Ship assignment updated successfully for user:', userId);
    res.json({ message: 'Ship assignment updated successfully' });
  } catch (error: any) {
    console.error('Update ship assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfileDetailsValidation = [
  body('bio').optional().isLength({ max: 1000 }).withMessage('Bio must be less than 1000 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('instagram').optional().isURL().withMessage('Invalid Instagram URL'),
  body('twitter').optional().isURL().withMessage('Invalid Twitter URL'),
  body('facebook').optional().isURL().withMessage('Invalid Facebook URL'),
  body('snapchat').optional().isLength({ max: 50 }).withMessage('Invalid Snapchat username'),
  body('website').optional().isURL().withMessage('Invalid website URL'),
  body('additionalPhotos').optional().isArray().withMessage('Additional photos must be an array'),
  body('additionalPhotos.*').optional().isString().withMessage('Each additional photo must be a string')
];

// Get user profile by ID (for viewing other users' profiles)
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user.userId;
    
    console.log('🔍 Getting user profile for:', userId, 'by user:', currentUserId);
    
    // Get user profile with department, subcategory, role, and ship information
    const [rows] = await pool.execute(
      `SELECT 
        u.id, u.email, u.display_name, u.profile_photo, u.bio, u.phone, 
        u.instagram, u.twitter, u.facebook, u.snapchat, u.website,
        u.additional_photo_1, u.additional_photo_2, u.additional_photo_3,
        u.department_id, u.subcategory_id, u.role_id, u.current_ship_id,
        u.is_email_verified, u.created_at, u.updated_at,
        d.name as department_name,
        sc.name as subcategory_name,
        r.name as role_name,
        s.name as ship_name,
        cl.name as cruise_line_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN subcategories sc ON u.subcategory_id = sc.id
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN ships s ON u.current_ship_id = s.id
       LEFT JOIN cruise_lines cl ON s.cruise_line_id = cl.id
       WHERE u.id = ? AND u.is_active = true`,
      [userId]
    );
    
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = (rows as any[])[0];
    console.log('✅ User found:', user.display_name);
    
    // Check connection status between current user and target user
    const [connectionRows] = await pool.execute(
      `SELECT id FROM connections 
       WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
      [currentUserId, userId, userId, currentUserId]
    );
    
    if (!Array.isArray(connectionRows)) {
      console.log('❌ Database error checking connections');
      return res.status(500).json({ error: 'Database error' });
    }
    
    const connection = (connectionRows as any[])[0];
    const connectionStatus = connection ? 'connected' : 'none';
    
    // Check if there's a pending connection request
    const [requestRows] = await pool.execute(
      `SELECT id, status FROM connection_requests 
       WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)`,
      [currentUserId, userId, userId, currentUserId]
    );
    
    if (!Array.isArray(requestRows)) {
      console.log('❌ Database error checking connection requests');
      return res.status(500).json({ error: 'Database error' });
    }
    
    const request = (requestRows as any[])[0];
    const requestStatus = request ? request.status : 'none';
    
    console.log('✅ Profile data retrieved successfully');
    res.json({ 
      user: {
        ...user,
        connectionStatus,
        requestStatus: requestStatus === 'none' ? 'none' : requestStatus
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
