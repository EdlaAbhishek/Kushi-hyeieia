/**
 * backend/middleware/validate.js
 * Input sanitisation and validation helper.
 * Uses express-validator under the hood.
 */

const { validationResult } = require('express-validator');

function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    next();
}

module.exports = { validate };
