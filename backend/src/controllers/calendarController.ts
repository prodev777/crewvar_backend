import { Request, Response } from 'express';
import pool from '../config/database';

// Get user's cruise assignments
export const getCruiseAssignments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        ca.id, ca.user_id, ca.cruise_line_id, ca.ship_id, 
        ca.start_date, ca.end_date, ca.status, ca.created_at, ca.updated_at,
        cl.name as cruise_line_name,
        s.name as ship_name
      FROM cruise_assignments ca
      LEFT JOIN cruise_lines cl ON ca.cruise_line_id = cl.id
      LEFT JOIN ships s ON ca.ship_id = s.id
      WHERE ca.user_id = ?
    `;

    const params: any[] = [userId];

    if (startDate && endDate) {
      query += ' AND ((ca.start_date <= ? AND ca.end_date >= ?) OR (ca.start_date <= ? AND ca.end_date >= ?))';
      params.push(endDate, startDate, endDate, startDate);
    }

    query += ' ORDER BY ca.start_date DESC';

    const [rows] = await pool.execute(query, params);
    res.json({ assignments: rows });
  } catch (error) {
    console.error('Get cruise assignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's calendar events
export const getCalendarEvents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        ce.id, ce.user_id, ce.title, ce.start_date, ce.end_date, 
        ce.event_type, ce.assignment_id, ce.description, ce.color,
        ce.created_at, ce.updated_at
      FROM calendar_events ce
      WHERE ce.user_id = ?
    `;

    const params: any[] = [userId];

    if (startDate && endDate) {
      query += ' AND ce.start_date <= ? AND ce.end_date >= ?';
      params.push(endDate, startDate);
    }

    query += ' ORDER BY ce.start_date ASC';

    const [rows] = await pool.execute(query, params);
    res.json({ events: rows });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new cruise assignment
export const createCruiseAssignment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { cruiseLineId, shipId, startDate, endDate, status = 'upcoming' } = req.body;

    if (!cruiseLineId || !shipId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    const [result] = await pool.execute(
      `INSERT INTO cruise_assignments 
       (user_id, cruise_line_id, ship_id, start_date, end_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, cruiseLineId, shipId, startDate, endDate, status]
    );

    const assignmentId = (result as any).insertId;

    // Get the created assignment with related data
    const [rows] = await pool.execute(
      `SELECT 
        ca.id, ca.user_id, ca.cruise_line_id, ca.ship_id, 
        ca.start_date, ca.end_date, ca.status, ca.created_at, ca.updated_at,
        cl.name as cruise_line_name,
        s.name as ship_name
       FROM cruise_assignments ca
       LEFT JOIN cruise_lines cl ON ca.cruise_line_id = cl.id
       LEFT JOIN ships s ON ca.ship_id = s.id
       WHERE ca.id = ?`,
      [assignmentId]
    );

    res.status(201).json({ assignment: (rows as any[])[0] });
  } catch (error) {
    console.error('Create cruise assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a cruise assignment
export const updateCruiseAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const userId = (req as any).user.userId;
    const { cruiseLineId, shipId, startDate, endDate, status } = req.body;

    // Check if assignment belongs to user
    const [existingRows] = await pool.execute(
      'SELECT id FROM cruise_assignments WHERE id = ? AND user_id = ?',
      [assignmentId, userId]
    );

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (cruiseLineId !== undefined) {
      updates.push('cruise_line_id = ?');
      params.push(cruiseLineId);
    }
    if (shipId !== undefined) {
      updates.push('ship_id = ?');
      params.push(shipId);
    }
    if (startDate !== undefined) {
      updates.push('start_date = ?');
      params.push(startDate);
    }
    if (endDate !== undefined) {
      updates.push('end_date = ?');
      params.push(endDate);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');
    params.push(assignmentId);

    await pool.execute(
      `UPDATE cruise_assignments SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated assignment
    const [rows] = await pool.execute(
      `SELECT 
        ca.id, ca.user_id, ca.cruise_line_id, ca.ship_id, 
        ca.start_date, ca.end_date, ca.status, ca.created_at, ca.updated_at,
        cl.name as cruise_line_name,
        s.name as ship_name
       FROM cruise_assignments ca
       LEFT JOIN cruise_lines cl ON ca.cruise_line_id = cl.id
       LEFT JOIN ships s ON ca.ship_id = s.id
       WHERE ca.id = ?`,
      [assignmentId]
    );

    res.json({ assignment: (rows as any[])[0] });
  } catch (error) {
    console.error('Update cruise assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a cruise assignment
export const deleteCruiseAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const userId = (req as any).user.userId;

    // Check if assignment belongs to user
    const [existingRows] = await pool.execute(
      'SELECT id FROM cruise_assignments WHERE id = ? AND user_id = ?',
      [assignmentId, userId]
    );

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await pool.execute(
      'DELETE FROM cruise_assignments WHERE id = ? AND user_id = ?',
      [assignmentId, userId]
    );

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete cruise assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a calendar event
export const createCalendarEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { title, startDate, endDate, eventType, assignmentId, description, color } = req.body;

    if (!title || !startDate || !endDate || !eventType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.execute(
      `INSERT INTO calendar_events 
       (user_id, title, start_date, end_date, event_type, assignment_id, description, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, title, startDate, endDate, eventType, assignmentId || null, description || null, color || '#069B93']
    );

    const eventId = (result as any).insertId;

    // Get the created event
    const [rows] = await pool.execute(
      `SELECT 
        ce.id, ce.user_id, ce.title, ce.start_date, ce.end_date, 
        ce.event_type, ce.assignment_id, ce.description, ce.color,
        ce.created_at, ce.updated_at
       FROM calendar_events ce
       WHERE ce.id = ?`,
      [eventId]
    );

    res.status(201).json({ event: (rows as any[])[0] });
  } catch (error) {
    console.error('Create calendar event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current assignment
export const getCurrentAssignment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const today = new Date().toISOString().split('T')[0];

    const [rows] = await pool.execute(
      `SELECT 
        ca.id, ca.user_id, ca.cruise_line_id, ca.ship_id, 
        ca.start_date, ca.end_date, ca.status, ca.created_at, ca.updated_at,
        cl.name as cruise_line_name,
        s.name as ship_name
       FROM cruise_assignments ca
       LEFT JOIN cruise_lines cl ON ca.cruise_line_id = cl.id
       LEFT JOIN ships s ON ca.ship_id = s.id
       WHERE ca.user_id = ? AND ca.start_date <= ? AND ca.end_date >= ? AND ca.status != 'cancelled'
       ORDER BY ca.start_date DESC
       LIMIT 1`,
      [userId, today, today]
    );

    const assignment = (rows as any[])[0] || null;
    res.json({ assignment });
  } catch (error) {
    console.error('Get current assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get upcoming assignments
export const getUpcomingAssignments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { limit = 5 } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const [rows] = await pool.execute(
      `SELECT 
        ca.id, ca.user_id, ca.cruise_line_id, ca.ship_id, 
        ca.start_date, ca.end_date, ca.status, ca.created_at, ca.updated_at,
        cl.name as cruise_line_name,
        s.name as ship_name
       FROM cruise_assignments ca
       LEFT JOIN cruise_lines cl ON ca.cruise_line_id = cl.id
       LEFT JOIN ships s ON ca.ship_id = s.id
       WHERE ca.user_id = ? AND ca.status = 'upcoming' AND ca.start_date > ?
       ORDER BY ca.start_date ASC
       LIMIT ?`,
      [userId, today, parseInt(limit as string)]
    );

    res.json({ assignments: rows });
  } catch (error) {
    console.error('Get upcoming assignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
