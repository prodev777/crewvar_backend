import { Request, Response } from 'express';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { createNotification } from './notificationController';

// Send connection request
export const sendConnectionRequest = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const requesterId = (req as any).user.userId;
        const { receiverId, message } = req.body;

        console.log('🔗 Sending connection request:', { requesterId, receiverId, message });

        // Check if users are the same
        if (requesterId === receiverId) {
            return res.status(400).json({ error: 'Cannot send connection request to yourself' });
        }

        // Check if receiver exists
        console.log('🔍 Checking if receiver exists:', receiverId);
        const [receiverRows] = await pool.execute(
            'SELECT id, display_name FROM users WHERE id = ? AND is_active = true',
            [receiverId]
        );

        if (!Array.isArray(receiverRows) || receiverRows.length === 0) {
            console.log('❌ Receiver not found:', receiverId);
            return res.status(404).json({ error: 'User not found' });
        }
        console.log('✅ Receiver found:', (receiverRows as any[])[0]);

        // Check if connection already exists
        console.log('🔍 Checking if connection already exists');
        const [existingConnectionRows] = await pool.execute(
            'SELECT id FROM connections WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
            [requesterId, receiverId, receiverId, requesterId]
        );

        if (!Array.isArray(existingConnectionRows) || existingConnectionRows.length > 0) {
            console.log('❌ Connection already exists');
            return res.status(400).json({ error: 'Connection already exists' });
        }
        console.log('✅ No existing connection found');

        // Check if request already exists
        console.log('🔍 Checking if request already exists');
        const [existingRequestRows] = await pool.execute(
            'SELECT id, status FROM connection_requests WHERE requester_id = ? AND receiver_id = ?',
            [requesterId, receiverId]
        );

        if (!Array.isArray(existingRequestRows)) {
            console.log('❌ Database error checking existing requests');
            return res.status(500).json({ error: 'Database error' });
        }

        if (existingRequestRows.length > 0) {
            const existingRequest = (existingRequestRows as any[])[0];
            console.log('📋 Existing request found:', existingRequest);
            if (existingRequest.status === 'pending') {
                console.log('❌ Request already pending');
                return res.status(400).json({ error: 'Connection request already sent' });
            } else if (existingRequest.status === 'declined') {
                console.log('🔄 Updating declined request to pending');
                // Update existing declined request to pending
                await pool.execute(
                    'UPDATE connection_requests SET status = "pending", request_message = ?, updated_at = NOW() WHERE id = ?',
                    [message, existingRequest.id]
                );
                return res.json({ message: 'Connection request sent successfully' });
            }
        }
        console.log('✅ No existing request found');

        // Create new connection request
        console.log('🆕 Creating new connection request');
        const requestId = uuidv4();
        await pool.execute(
            'INSERT INTO connection_requests (id, requester_id, receiver_id, status, request_message) VALUES (?, ?, ?, "pending", ?)',
            [requestId, requesterId, receiverId, message]
        );
        console.log('✅ Connection request created:', requestId);

        // Create notification for the receiver
        console.log('🔔 Creating notification for receiver');
        const receiver = (receiverRows as any[])[0];
        
        // Get requester info for the notification message
        const [requesterRows] = await pool.execute(
            'SELECT display_name FROM users WHERE id = ?',
            [requesterId]
        );
        
        if (!Array.isArray(requesterRows) || requesterRows.length === 0) {
            console.log('❌ Requester not found for notification:', requesterId);
            return res.status(500).json({ error: 'Requester data not found' });
        }
        
        const requester = (requesterRows as any[])[0];
        
        try {
            await createNotification(
                receiverId,
                'connection_request',
                'New Connection Request',
                `${requester.display_name} sends connect to you`,
                { requestId, requesterId, message }
            );
            console.log('✅ Notification created');
        } catch (notificationError) {
            console.error('⚠️ Notification creation failed:', notificationError);
            // Don't fail the entire request if notification fails
            // The connection request was already created successfully
        }

        console.log('🎉 Connection request process completed successfully');
        res.json({ message: 'Connection request sent successfully' });

    } catch (error: any) {
        console.error('Send connection request error:', error?.message, error?.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get pending connection requests (received by current user)
export const getPendingRequests = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.userId;

        console.log('Getting pending requests for user:', currentUserId);

        const [requestRows] = await pool.execute(`
            SELECT 
                cr.id,
                cr.requester_id,
                cr.receiver_id,
                cr.status,
                cr.request_message as message,
                cr.created_at,
                u.display_name,
                u.profile_photo,
                u.role_id,
                u.department_id,
                u.current_ship_id,
                COALESCE(s.name, 'Unknown Ship') as ship_name,
                COALESCE(cl.name, 'Unknown Cruise Line') as cruise_line_name,
                COALESCE(d.name, 'Not specified') as department_name,
                COALESCE(r.name, 'Not specified') as role_name
            FROM connection_requests cr
            JOIN users u ON cr.requester_id = u.id
            LEFT JOIN ships s ON u.current_ship_id = s.id
            LEFT JOIN cruise_lines cl ON s.cruise_line_id = cl.id
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE cr.receiver_id = ? AND cr.status = 'pending'
            ORDER BY cr.created_at DESC
        `, [currentUserId]);

        console.log('Pending requests found:', (requestRows as any[]).length);
        res.json({
            success: true,
            requests: requestRows
        });

    } catch (error: any) {
        console.error('Get pending requests error:', error?.message, error?.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Respond to connection request (accept/decline)
export const respondToConnectionRequest = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const currentUserId = (req as any).user.userId;
        const { requestId, action } = req.body; // action: 'accept' or 'decline'

        console.log('🔗 Responding to connection request:', { requestId, action, currentUserId });

        // Get the connection request
        const [requestRows] = await pool.execute(
            'SELECT * FROM connection_requests WHERE id = ? AND receiver_id = ? AND status = "pending"',
            [requestId, currentUserId]
        );

        if (!Array.isArray(requestRows)) {
            console.log('❌ Database error checking connection request');
            return res.status(500).json({ error: 'Database error' });
        }

        if (requestRows.length === 0) {
            console.log('❌ Connection request not found:', requestId);
            return res.status(404).json({ error: 'Connection request not found' });
        }

        const request = (requestRows as any[])[0];
        console.log('✅ Connection request found:', request);

        if (action === 'accept') {
            // Update request status to accepted
            await pool.execute(
                'UPDATE connection_requests SET status = "accepted", updated_at = NOW() WHERE id = ?',
                [requestId]
            );

            // Create connection record
            const connectionId = uuidv4();
            await pool.execute(
                'INSERT INTO connections (id, user1_id, user2_id) VALUES (?, ?, ?)',
                [connectionId, request.requester_id, request.receiver_id]
            );

            // Get receiver info for notification (the person who accepted)
            const [receiverRows] = await pool.execute(
                'SELECT display_name FROM users WHERE id = ?',
                [request.receiver_id]
            );
            
            if (!Array.isArray(receiverRows) || receiverRows.length === 0) {
                console.log('❌ Receiver not found for notification:', request.receiver_id);
                return res.status(500).json({ error: 'Receiver data not found' });
            }
            
            const receiver = (receiverRows as any[])[0];

            // Create notification for the requester
            try {
                await createNotification(
                    request.requester_id,
                    'connection_accepted',
                    'Connection Request Accepted',
                    `Your connection request was accepted by ${receiver.display_name}`,
                    { connectionId, receiverId: request.receiver_id }
                );
                console.log('✅ Notification created successfully');
            } catch (notificationError) {
                console.error('⚠️ Notification creation failed:', notificationError);
                // Don't fail the entire request if notification fails
                // The connection was already created successfully
            }

            console.log('Connection created:', connectionId);
            res.json({ message: 'Connection request accepted' });

        } else if (action === 'decline') {
            console.log('🔗 Declining connection request:', requestId);
            
            // Update request status to declined
            await pool.execute(
                'UPDATE connection_requests SET status = "declined", updated_at = NOW() WHERE id = ?',
                [requestId]
            );
            console.log('✅ Request status updated to declined');

            // Get receiver info for notification (the person who declined)
            const [receiverRows] = await pool.execute(
                'SELECT display_name FROM users WHERE id = ?',
                [request.receiver_id]
            );
            
            if (!Array.isArray(receiverRows) || receiverRows.length === 0) {
                console.log('❌ Receiver not found for notification:', request.receiver_id);
                return res.status(500).json({ error: 'Receiver data not found' });
            }
            
            const receiver = (receiverRows as any[])[0];

            // Create notification for the requester
            try {
                await createNotification(
                    request.requester_id,
                    'connection_declined',
                    'Connection Request Declined',
                    `Your connection request was declined by ${receiver.display_name}`,
                    { requestId, receiverId: request.receiver_id }
                );
                console.log('✅ Notification created successfully');
            } catch (notificationError) {
                console.error('⚠️ Notification creation failed:', notificationError);
                // Don't fail the entire request if notification fails
                // The request was already declined successfully
            }

            console.log('🎉 Connection request declined successfully');
            res.json({ message: 'Connection request declined' });

        } else {
            return res.status(400).json({ error: 'Invalid action. Must be "accept" or "decline"' });
        }

    } catch (error: any) {
        console.error('Respond to connection request error:', error?.message, error?.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all connections for current user
export const getConnections = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.userId;

        console.log('Getting connections for user:', currentUserId);

        const [connectionRows] = await pool.execute(`
            SELECT 
                c.id,
                c.user1_id,
                c.user2_id,
                c.created_at,
                CASE 
                    WHEN c.user1_id = ? THEN u2.display_name
                    ELSE u1.display_name
                END as display_name,
                CASE 
                    WHEN c.user1_id = ? THEN u2.profile_photo
                    ELSE u1.profile_photo
                END as profile_photo,
                CASE 
                    WHEN c.user1_id = ? THEN u2.role_id
                    ELSE u1.role_id
                END as role_id,
                CASE 
                    WHEN c.user1_id = ? THEN u2.department_id
                    ELSE u1.department_id
                END as department_id,
                CASE 
                    WHEN c.user1_id = ? THEN u2.current_ship_id
                    ELSE u1.current_ship_id
                END as current_ship_id,
                COALESCE(s.name, 'Unknown Ship') as ship_name,
                COALESCE(cl.name, 'Unknown Cruise Line') as cruise_line_name,
                COALESCE(d.name, 'Not specified') as department_name,
                COALESCE(r.name, 'Not specified') as role_name
            FROM connections c
            LEFT JOIN users u1 ON c.user1_id = u1.id
            LEFT JOIN users u2 ON c.user2_id = u2.id
            LEFT JOIN ships s ON CASE 
                WHEN c.user1_id = ? THEN u2.current_ship_id
                ELSE u1.current_ship_id
            END = s.id
            LEFT JOIN cruise_lines cl ON s.cruise_line_id = cl.id
            LEFT JOIN departments d ON CASE 
                WHEN c.user1_id = ? THEN u2.department_id
                ELSE u1.department_id
            END = d.id
            LEFT JOIN roles r ON CASE 
                WHEN c.user1_id = ? THEN u2.role_id
                ELSE u1.role_id
            END = r.id
            WHERE c.user1_id = ? OR c.user2_id = ?
            ORDER BY c.created_at DESC
        `, [
            currentUserId, currentUserId, currentUserId, currentUserId, currentUserId,
            currentUserId, currentUserId, currentUserId, currentUserId, currentUserId
        ]);

        console.log('Connections found:', (connectionRows as any[]).length);
        res.json({
            success: true,
            connections: connectionRows
        });

    } catch (error: any) {
        console.error('Get connections error:', error?.message, error?.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Remove connection
export const removeConnection = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.userId;
        const { connectionId } = req.params;

        console.log('Removing connection:', { connectionId, currentUserId });

        // Check if connection exists and user is part of it
        const [connectionRows] = await pool.execute(
            'SELECT id FROM connections WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
            [connectionId, currentUserId, currentUserId]
        );

        if ((connectionRows as any[]).length === 0) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        // Remove connection
        await pool.execute('DELETE FROM connections WHERE id = ?', [connectionId]);

        console.log('Connection removed:', connectionId);
        res.json({ message: 'Connection removed successfully' });

    } catch (error: any) {
        console.error('Remove connection error:', error?.message, error?.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Check connection status between two users
export const checkConnectionStatus = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.userId;
        const { targetUserId } = req.params;

        console.log('Checking connection status:', { currentUserId, targetUserId });

        // Check if they are connected
        const [connectionRows] = await pool.execute(
            'SELECT id FROM connections WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
            [currentUserId, targetUserId, targetUserId, currentUserId]
        );

        if ((connectionRows as any[]).length > 0) {
            return res.json({
                success: true,
                status: 'connected'
            });
        }

        // Check for pending request
        const [requestRows] = await pool.execute(
            'SELECT id, status FROM connection_requests WHERE requester_id = ? AND receiver_id = ?',
            [currentUserId, targetUserId]
        );

        if ((requestRows as any[]).length > 0) {
            const request = (requestRows as any[])[0];
            return res.json({
                success: true,
                status: request.status
            });
        }

        res.json({
            success: true,
            status: 'none'
        });

    } catch (error: any) {
        console.error('Check connection status error:', error?.message, error?.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Validation rules
export const sendConnectionRequestValidation = [
    body('receiverId').notEmpty().withMessage('Receiver ID is required'),
    body('message').optional().isLength({ max: 500 }).withMessage('Message must be less than 500 characters')
];

export const respondToConnectionRequestValidation = [
    body('requestId').notEmpty().withMessage('Request ID is required'),
    body('action').isIn(['accept', 'decline']).withMessage('Action must be "accept" or "decline"')
];
