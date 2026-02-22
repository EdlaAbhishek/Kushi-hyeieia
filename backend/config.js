/**
 * backend/config.js
 * All configuration values read from environment variables.
 * No secrets in source code.
 */

require('dotenv').config({ path: '../.env' });

module.exports = {
    PORT: process.env.PORT || 3000,
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || 'http://localhost:5500',
    DB_HOST: process.env.DB_HOST,
    DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASS: process.env.DB_PASS,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NODE_ENV: process.env.NODE_ENV || 'development',
};
