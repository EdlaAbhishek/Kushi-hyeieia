/**
 * backend/routes/ai.js
 */
const router = require('express').Router();
const controller = require('../controllers/aiController');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');

router.post('/chat',
    [
        body('message').trim().notEmpty().isLength({ max: 2000 }),
        body('context').optional().isArray({ max: 20 }),
        validate,
    ],
    controller.chat
);

module.exports = router;
