/**
 * backend/routes/auth.js
 */
const router = require('express').Router();
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');

router.post('/register',
    [
        body('full_name').trim().notEmpty(),
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }),
        validate,
    ],
    authController.register
);

router.post('/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty(),
        validate,
    ],
    authController.login
);

router.post('/logout', authController.logout);

module.exports = router;
