/**
 * backend/routes/emergency.js
 */
const router = require('express').Router();
const controller = require('../controllers/emergencyController');
const { validate } = require('../middleware/validate');
const { body, query } = require('express-validator');

router.post('/trigger',
    [
        body('lat').optional().isFloat(),
        body('lng').optional().isFloat(),
        validate,
    ],
    controller.trigger
);

router.get('/hospitals',
    [query('lat').isFloat(), query('lng').isFloat(), validate],
    controller.nearbyHospitals
);

router.post('/blood',
    [body('bloodType').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']), validate],
    controller.bloodRequest
);

module.exports = router;
