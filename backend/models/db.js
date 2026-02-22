/**
 * backend/models/db.js
 * PostgreSQL connection pool. All models use this.
 */
const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASS,
    ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
});

module.exports = { query: pool.query.bind(pool) };
