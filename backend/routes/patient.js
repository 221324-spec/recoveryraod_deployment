const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const patientController = require('../controllers/patientController');
const relapseController = require('../controllers/relapseController');
const moduleIVController = require('../controllers/moduleIVController');
const User = require('../models/User');

// Apply auth to all patient routes
router.use(authenticate);

const allowPatientWrite = authorize('patient');
const allowPatientRead = authorize('patient', 'supervisor', 'ngo', 'admin');

const ensurePatientAccess = async (req, res, next) => {
	try {
		const patientId = req.params.id;
		if (!patientId || !patientId.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid patient ID'
			});
		}

		const role = String(req.user?.role || '').toLowerCase();
		const requesterId = String(req.user?.userId || req.user?._id || '');

		// Admin/NGO can access patient resources broadly.
		if (role === 'admin' || role === 'ngo') return next();

		// Patient can only access their own record.
		if (role === 'patient') {
			if (requesterId !== String(patientId)) {
				return res.status(403).json({
					success: false,
					message: 'Access denied. You can only access your own data.'
				});
			}
			return next();
		}

		// Supervisor can only access assigned patients.
		if (role === 'supervisor') {
			const patient = await User.findById(patientId).select('assignedSupervisor');
			if (!patient) {
				return res.status(404).json({
					success: false,
					message: 'Patient not found'
				});
			}
			const assignedSupervisorId = patient.assignedSupervisor ? String(patient.assignedSupervisor) : null;
			if (!assignedSupervisorId || assignedSupervisorId !== requesterId) {
				return res.status(403).json({
					success: false,
					message: 'Access denied. Patient is not assigned to this supervisor.'
				});
			}
			return next();
		}

		return res.status(403).json({
			success: false,
			message: 'Access denied. Insufficient permissions.'
		});
	} catch (error) {
		console.error('ensurePatientAccess error:', error);
		return res.status(500).json({
			success: false,
			message: 'Authorization check failed.'
		});
	}
};

// Moods
router.post('/:id/moods', allowPatientWrite, ensurePatientAccess, patientController.postMood);
router.get('/:id/moods', allowPatientRead, ensurePatientAccess, patientController.getMoods);
router.get('/:id/moods/stats', allowPatientRead, ensurePatientAccess, patientController.getMoodStats);

// Triggers
router.post('/:id/triggers', allowPatientWrite, ensurePatientAccess, patientController.postTrigger);
router.get('/:id/triggers', allowPatientRead, ensurePatientAccess, patientController.getTriggers);
router.get('/:id/triggers/top', allowPatientRead, ensurePatientAccess, patientController.getTopTriggers);

// Activities
router.post('/:id/activities', allowPatientWrite, ensurePatientAccess, patientController.postActivity);
router.get('/:id/activities', allowPatientRead, ensurePatientAccess, patientController.getActivities);
router.get('/:id/points', allowPatientRead, ensurePatientAccess, patientController.getPoints);

// Relapses (FEATURE-2A)
router.post('/:id/relapses', allowPatientWrite, ensurePatientAccess, relapseController.createRelapse);
router.get('/:id/relapses', allowPatientRead, ensurePatientAccess, relapseController.getPatientRelapses);

// Risk scoring (FEATURE-2B)
router.post('/:id/risk/evaluate', allowPatientWrite, ensurePatientAccess, moduleIVController.evaluateRisk);
router.get('/:id/risk', allowPatientRead, ensurePatientAccess, moduleIVController.getRisk);

// Crisis SOS (FEATURE-2 CrisisButton)
router.post('/:id/sos', allowPatientWrite, ensurePatientAccess, moduleIVController.createSOS);

// Check-in completion status (FEATURE-1 polish)
router.get('/:id/checkin-status', allowPatientRead, ensurePatientAccess, moduleIVController.getCheckinStatus);

// Journal keyword insights (FEATURE-1 polish)
router.get('/:id/journal-keywords', allowPatientRead, ensurePatientAccess, moduleIVController.getJournalKeywords);

module.exports = router;