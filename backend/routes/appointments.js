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
        body('doctorId').isUUID(),
        body('scheduledAt').isISO8601(),
        body('type').isIn(['in-person', 'telehealth']),
        validate,
    ],
    controller.book
);

router.get('/mine', controller.getMyAppointments);
router.delete('/:id', controller.cancel);

module.exports = router;
