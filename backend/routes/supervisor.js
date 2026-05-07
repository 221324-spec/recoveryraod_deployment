const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisorController');
const relapseController = require('../controllers/relapseController');
const moduleIVController = require('../controllers/moduleIVController');
const aiInsightsController = require('../controllers/aiInsightsController');
const aiMoodController = require('../controllers/aiMoodController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(authorize('supervisor'));

// Get all patients assigned to a supervisor
router.get('/:supervisorId/patients', supervisorController.getPatients);

// Get detailed overview of a specific patient
router.get('/:supervisorId/patients/:patientId/overview', supervisorController.getPatientOverview);

// Get aggregated statistics for all patients
router.get('/:supervisorId/statistics', supervisorController.getPatientStatistics);

// Get alerts and notifications
router.get('/:supervisorId/alerts', supervisorController.getAlerts);

// Relapses across assigned patients (FEATURE-2A)
router.get('/:supervisorId/relapses', relapseController.getSupervisorRelapses);

// Export patient summary (FEATURE-1 polish: weekly/monthly CSV data)
router.get('/:supervisorId/patients/:patientId/export', moduleIVController.exportPatientSummary);

// AI Insights & Analytics — aggregated analytics across assigned patients
router.get('/:supervisorId/ai-insights', aiInsightsController.getAIInsights);

// Module V: AI Mood Scan — supervisor endpoints
router.get('/:supervisorId/ai-mood/scans', aiMoodController.supervisorGetScans);
router.get('/:supervisorId/ai-mood/scans/:scanId/screenshot', aiMoodController.supervisorGetScreenshot);
router.get('/:supervisorId/ai-mood/weekly-distribution', aiMoodController.supervisorWeeklyDistribution);

module.exports = router;