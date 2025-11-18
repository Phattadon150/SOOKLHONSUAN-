const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  
  ssl: process.env.DB_SSL === 'true' 
        ? { rejectUnauthorized: false } 
        : false,
});

pool.on('connect', () => {
  console.log('[DB] Connected to database pool');
});

pool.on('error', (err, client) => {
  console.error('[DB] Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
