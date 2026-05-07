const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointmentController');

router.post('/:id', controller.createAppointment);
router.get('/:id', controller.getAppointments);

module.exports = router;
