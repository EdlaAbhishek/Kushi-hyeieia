/**
 * backend/routes/appointments.js
 */
const router = require('express').Router();
const controller = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { body, query } = require('express-validator');

router.use(authenticate); // All appointment routes require auth

router.get('/slots',
    [query('doctorId').isUUID(), query('date').isISO8601(), validate],
    controller.getSlots
);

router.post('/',
    [
        body('doctor_id').notEmpty(),
        body('appointment_date').notEmpty(),
        body('appointment_time').notEmpty(),
        validate,
    ],
    controller.book
);

router.get('/mine', controller.getMyAppointments);
router.get('/doctor', controller.getDoctorAppointments);
router.patch('/:id', controller.updateAppointment);
router.delete('/:id', controller.cancel);

module.exports = router;
