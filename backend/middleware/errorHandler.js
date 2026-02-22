/**
 * backend/middleware/errorHandler.js
 * Global error handling middleware.
 */

const config = require('../config');

function errorHandler(err, _req, res, _next) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    const body = { error: message };

    // Only expose stack trace in development
    if (config.NODE_ENV === 'development') {
        body.stack = err.stack;
    }

    res.status(statusCode).json(body);
}

module.exports = errorHandler;
