import { Request, Response } from 'express';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Get chat rooms for a user
export const getChatRooms = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const [rooms] = await pool.execute(`
      SELECT 
        cr.id as room_id,
        cr.participant1_id,
        cr.participant2_id,
        cr.created_at,
        cr.updated_at,
        CASE 
          WHEN cr.participant1_id = ? THEN cr.participant2_id 
          ELSE cr.participant1_id 
        END as other_user_id,
        u.display_name as other_user_name,
        u.profile_photo as other_user_avatar,
        us.is_online as other_user_online,
        us.last_seen as other_user_last_seen,
        cm.content as last_message_content,
        cm.created_at as last_message_time,
        cm.status as last_message_status,
        cm.sender_id as last_message_sender_id,
        COALESCE(unread_count.count, 0) as unread_count
      FROM chat_rooms cr
      LEFT JOIN users u ON (
        CASE 
          WHEN cr.participant1_id = ? THEN cr.participant2_id 
          ELSE cr.participant1_id 
        END = u.id
      )
      LEFT JOIN user_online_status us ON u.id = us.user_id
      LEFT JOIN (
        SELECT 
          room_id,
          content,
          created_at,
          status,
          sender_id,
          ROW_NUMBER() OVER (PARTITION BY room_id ORDER BY created_at DESC) as rn
        FROM chat_messages
      ) cm ON cr.id = cm.room_id AND cm.rn = 1
      LEFT JOIN (
        SELECT 
          room_id,
          COUNT(*) as count
        FROM chat_messages
        WHERE receiver_id = ? AND status != 'read'
        GROUP BY room_id
      ) unread_count ON cr.id = unread_count.room_id
      WHERE cr.participant1_id = ? OR cr.participant2_id = ?
      ORDER BY COALESCE(cm.created_at, cr.updated_at) DESC
    `, [userId, userId, userId, userId, userId]);

    res.json({
      success: true,
      rooms: rooms
    });
  } catch (error: any) {
    console.error('Error getting chat rooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get messages for a specific chat room
export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { otherUserId } = req.params;

    // Find or create chat room
    let [rooms] = await pool.execute(`
      SELECT id FROM chat_rooms 
      WHERE (participant1_id = ? AND participant2_id = ?) 
         OR (participant1_id = ? AND participant2_id = ?)
    `, [userId, otherUserId, otherUserId, userId]);

    let roomId;
    if (Array.isArray(rooms) && rooms.length === 0) {
      // Create new chat room
      roomId = uuidv4();
      await pool.execute(`
        INSERT INTO chat_rooms (id, participant1_id, participant2_id)
        VALUES (?, ?, ?)
      `, [roomId, userId, otherUserId]);
    } else {
      roomId = (rooms as any)[0].id;
    }

    // Get messages for this room
    const [messages] = await pool.execute(`
      SELECT 
        cm.id,
        cm.sender_id,
        cm.receiver_id,
        cm.content,
        cm.message_type,
        cm.status,
        cm.created_at as timestamp,
        u.display_name as sender_name,
        u.profile_photo as sender_avatar
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.room_id = ?
      ORDER BY cm.created_at ASC
    `, [roomId]);

    // Mark messages as read
    await pool.execute(`
      UPDATE chat_messages 
      SET status = 'read' 
      WHERE room_id = ? AND receiver_id = ? AND status != 'read'
    `, [roomId, userId]);

    res.json({
      success: true,
      roomId,
      messages: messages
    });
  } catch (error: any) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send a message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { receiverId, content, messageType = 'text' } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver ID and content are required' });
    }

    // Find or create chat room
    let [rooms] = await pool.execute(`
      SELECT id FROM chat_rooms 
      WHERE (participant1_id = ? AND participant2_id = ?) 
         OR (participant1_id = ? AND participant2_id = ?)
    `, [userId, receiverId, receiverId, userId]);

    let roomId;
    if (Array.isArray(rooms) && rooms.length === 0) {
      // Create new chat room
      roomId = uuidv4();
      await pool.execute(`
        INSERT INTO chat_rooms (id, participant1_id, participant2_id)
        VALUES (?, ?, ?)
      `, [roomId, userId, receiverId]);
    } else {
      roomId = (rooms as any)[0].id;
    }

    // Insert message
    const messageId = uuidv4();
    await pool.execute(`
      INSERT INTO chat_messages (id, room_id, sender_id, receiver_id, content, message_type, status)
      VALUES (?, ?, ?, ?, ?, ?, 'sent')
    `, [messageId, roomId, userId, receiverId, content, messageType]);

    // Get the created message with sender info
    const [messages] = await pool.execute(`
      SELECT 
        cm.id,
        cm.sender_id,
        cm.receiver_id,
        cm.content,
        cm.message_type,
        cm.status,
        cm.created_at as timestamp,
        u.display_name as sender_name,
        u.profile_photo as sender_avatar
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.id = ?
    `, [messageId]);

    res.json({
      success: true,
      message: (messages as any)[0]
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update message status (delivered/read)
export const updateMessageStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { messageId, status } = req.body;

    if (!messageId || !status) {
      return res.status(400).json({ error: 'Message ID and status are required' });
    }

    await pool.execute(`
      UPDATE chat_messages 
      SET status = ? 
      WHERE id = ? AND receiver_id = ?
    `, [status, messageId, userId]);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating message status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user online status
export const updateOnlineStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { isOnline } = req.body;

    await pool.execute(`
      INSERT INTO user_online_status (user_id, is_online, last_seen)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        is_online = VALUES(is_online),
        last_seen = CASE 
          WHEN VALUES(is_online) = FALSE THEN VALUES(last_seen)
          ELSE last_seen
        END,
        updated_at = NOW()
    `, [userId, isOnline]);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating online status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user online status
export const getUserOnlineStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const [status] = await pool.execute(`
      SELECT is_online, last_seen
      FROM user_online_status
      WHERE user_id = ?
    `, [userId]);

    res.json({
      success: true,
      status: (status as any)[0] || { is_online: false, last_seen: null }
    });
  } catch (error: any) {
    console.error('Error getting user online status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
