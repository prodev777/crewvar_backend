import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const createTestNotifications = async () => {
  try {
    console.log('Creating test notifications...');

    // Get a user ID from the database
    const [userRows] = await pool.execute('SELECT id FROM users LIMIT 1');
    
    if (!Array.isArray(userRows) || userRows.length === 0) {
      console.log('No users found. Please create a user first.');
      return;
    }

    const userId = (userRows[0] as any).id;
    console.log(`Creating notifications for user: ${userId}`);

    // Create test notifications
    const testNotifications = [
      {
        type: 'connection_request',
        title: 'New Connection Request',
        message: 'John Doe wants to connect with you',
        data: JSON.stringify({ requesterId: 'user-123', requesterName: 'John Doe' })
      },
      {
        type: 'message',
        title: 'New Message',
        message: 'You have a new message from Sarah Wilson',
        data: JSON.stringify({ senderId: 'user-456', senderName: 'Sarah Wilson', messageId: 'msg-789' })
      },
      {
        type: 'system',
        title: 'System Update',
        message: 'The app has been updated with new features',
        data: JSON.stringify({ updateVersion: '1.2.0', features: ['notifications', 'real-time chat'] })
      },
      {
        type: 'assignment',
        title: 'Assignment Update',
        message: 'Your cruise assignment has been updated',
        data: JSON.stringify({ assignmentId: 'assign-123', shipId: 'ship-456', newDate: '2025-09-20' })
      },
      {
        type: 'port_connection',
        title: 'Port Connection Alert',
        message: 'Your ship is arriving at Port of Miami',
        data: JSON.stringify({ portName: 'Port of Miami', arrivalTime: '2025-09-15 08:00:00' })
      }
    ];

    // Insert test notifications
    for (const notification of testNotifications) {
      const notificationId = uuidv4();
      await pool.execute(
        `INSERT INTO notifications 
         (id, user_id, type, title, message, data, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())`,
        [notificationId, userId, notification.type, notification.title, notification.message, notification.data]
      );
    }

    console.log('Test notifications created successfully!');
    
    // Create default notification preferences
    const notificationTypes = [
      'connection_request',
      'connection_accepted', 
      'message',
      'system',
      'assignment',
      'port_connection',
      'moderation'
    ];

    for (const type of notificationTypes) {
      const preferenceId = uuidv4();
      await pool.execute(
        `INSERT INTO notification_preferences 
         (id, user_id, type, email_enabled, push_enabled, in_app_enabled, created_at)
         VALUES (?, ?, ?, TRUE, TRUE, TRUE, NOW())
         ON DUPLICATE KEY UPDATE
         email_enabled = VALUES(email_enabled),
         push_enabled = VALUES(push_enabled),
         in_app_enabled = VALUES(in_app_enabled)`,
        [preferenceId, userId, type]
      );
    }

    console.log('Default notification preferences created successfully!');

  } catch (error) {
    console.error('Error creating test notifications:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createTestNotifications()
    .then(() => {
      console.log('Test notifications setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create test notifications:', error);
      process.exit(1);
    });
}
