const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const ctrl = require('../controllers/eventController');

// ─── Shared (all authenticated users) ───
router.get('/', auth, ctrl.getAllEvents);

// ─── Patient (must be before /:id routes) ───
router.get('/my/events', auth, ctrl.getMyEvents);
router.get('/my/rewards', auth, ctrl.getMyRewards);

// ─── Supervisor / Admin ───
router.post('/', auth, ctrl.createEvent);
router.put('/participation/:participationId/attend', auth, ctrl.markAttended);
router.put('/:id', auth, ctrl.updateEvent);
router.delete('/:id', auth, ctrl.deleteEvent);
router.get('/:id/participants', auth, ctrl.getEventParticipants);

// ─── Patient (parameterized) ───
router.post('/:id/join', auth, ctrl.joinEvent);
router.post('/:id/cancel', auth, ctrl.cancelRegistration);

module.exports = router;
