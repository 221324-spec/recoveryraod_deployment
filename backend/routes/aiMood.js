const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const aiMoodCtrl = require('../controllers/aiMoodController');

// Multer: memory storage, 1MB limit, image only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, or WebP images are allowed'), false);
    }
  }
});

// All routes require auth
router.use(authMiddleware);

// ─── Patient endpoints ────────────────────────────────────────────
// GET  /api/patients/:id/ai-mood/should-prompt
router.get('/:id/ai-mood/should-prompt', aiMoodCtrl.shouldPrompt);

// POST /api/patients/:id/ai-mood/prompt-log
router.post('/:id/ai-mood/prompt-log', aiMoodCtrl.logPrompt);

// POST /api/patients/:id/ai-mood/scan  (multipart upload: field "screenshot")
router.post('/:id/ai-mood/scan', upload.single('screenshot'), aiMoodCtrl.createScan);

// GET  /api/patients/:id/ai-mood/scans
router.get('/:id/ai-mood/scans', aiMoodCtrl.getPatientScans);

// GET  /api/patients/:id/ai-mood/scans/:scanId/screenshot
router.get('/:id/ai-mood/scans/:scanId/screenshot', aiMoodCtrl.getPatientScreenshot);

// POST /api/patients/:id/ai-mood/support-action
router.post('/:id/ai-mood/support-action', aiMoodCtrl.logSupportAction);

module.exports = router;
