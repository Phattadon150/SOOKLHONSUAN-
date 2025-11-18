const { Pool } = require('pg');
require('dotenv').config(); // (เผื่อไว้ กันเหนียว)

// ⭐️ นี่คือส่วนที่แก้ไข ⭐️
// เราจะ "บอก" Pool โดยตรงว่าให้ใช้ตัวแปรชื่ออะไร
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,        // 👈 ใช้ DB_USER จาก .env
  password: process.env.DB_PASS,  // 👈 ใช้ DB_PASS จาก .env
  database: process.env.DB_NAME,    // 👈 ใช้ DB_NAME จาก .env
  
  // (ตั้งค่า SSL ตามไฟล์ .env ของคุณ)
  ssl: process.env.DB_SSL === 'true' 
        ? { rejectUnauthorized: false } 
        : false,
});

// (โค้ดส่วนที่เหลือของไฟล์นี้ อาจจะมีอยู่แล้ว)
pool.on('connect', () => {
  console.log('[DB] Connected to database pool');
});

pool.on('error', (err, client) => {
  console.error('[DB] Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;