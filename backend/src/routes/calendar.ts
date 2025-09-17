import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getCruiseAssignments,
  getCalendarEvents,
  createCruiseAssignment,
  updateCruiseAssignment,
  deleteCruiseAssignment,
  createCalendarEvent,
  getCurrentAssignment,
  getUpcomingAssignments
} from '../controllers/calendarController';

const router = express.Router();

// GET /api/calendar/assignments - Get user's cruise assignments
router.get('/assignments', authenticateToken, getCruiseAssignments);

// GET /api/calendar/events - Get user's calendar events
router.get('/events', authenticateToken, getCalendarEvents);

// POST /api/calendar/assignments - Create a new cruise assignment
router.post('/assignments', authenticateToken, createCruiseAssignment);

// PUT /api/calendar/assignments/:assignmentId - Update a cruise assignment
router.put('/assignments/:assignmentId', authenticateToken, updateCruiseAssignment);

// DELETE /api/calendar/assignments/:assignmentId - Delete a cruise assignment
router.delete('/assignments/:assignmentId', authenticateToken, deleteCruiseAssignment);

// POST /api/calendar/events - Create a calendar event
router.post('/events', authenticateToken, createCalendarEvent);

// GET /api/calendar/assignments/current - Get current assignment
router.get('/assignments/current', authenticateToken, getCurrentAssignment);

// GET /api/calendar/assignments/upcoming - Get upcoming assignments
router.get('/assignments/upcoming', authenticateToken, getUpcomingAssignments);

export default router;
