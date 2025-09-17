"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const calendarController_1 = require("../controllers/calendarController");
const router = express_1.default.Router();
// GET /api/calendar/assignments - Get user's cruise assignments
router.get('/assignments', auth_1.authenticateToken, calendarController_1.getCruiseAssignments);
// GET /api/calendar/events - Get user's calendar events
router.get('/events', auth_1.authenticateToken, calendarController_1.getCalendarEvents);
// POST /api/calendar/assignments - Create a new cruise assignment
router.post('/assignments', auth_1.authenticateToken, calendarController_1.createCruiseAssignment);
// PUT /api/calendar/assignments/:assignmentId - Update a cruise assignment
router.put('/assignments/:assignmentId', auth_1.authenticateToken, calendarController_1.updateCruiseAssignment);
// DELETE /api/calendar/assignments/:assignmentId - Delete a cruise assignment
router.delete('/assignments/:assignmentId', auth_1.authenticateToken, calendarController_1.deleteCruiseAssignment);
// POST /api/calendar/events - Create a calendar event
router.post('/events', auth_1.authenticateToken, calendarController_1.createCalendarEvent);
// GET /api/calendar/assignments/current - Get current assignment
router.get('/assignments/current', auth_1.authenticateToken, calendarController_1.getCurrentAssignment);
// GET /api/calendar/assignments/upcoming - Get upcoming assignments
router.get('/assignments/upcoming', auth_1.authenticateToken, calendarController_1.getUpcomingAssignments);
exports.default = router;
//# sourceMappingURL=calendar.js.map