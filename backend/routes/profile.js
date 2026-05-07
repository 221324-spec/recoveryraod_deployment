const express = require('express');
const router = express.Router();
const controller = require('../controllers/profileController');

router.get('/:id', controller.getProfile);
router.patch('/:id', controller.updateProfile);

module.exports = router;
