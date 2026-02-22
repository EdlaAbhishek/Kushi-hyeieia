/**
 * backend/routes/doctors.js
 */
const router = require('express').Router();
const controller = require('../controllers/doctorController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { body, query } = require('express-validator');

router.get('/',
    [query('specialty').optional().isString(), validate],
    controller.search
);

router.get('/:id', controller.getById);

router.post('/register',
    authenticate,
    [
        body('specialty').trim().notEmpty(),
        body('registration_no').trim().notEmpty(),
        validate,
    ],
    controller.register
);

module.exports = router;
