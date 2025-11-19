const { Pool } = require('pg');
require('dotenv').config(); // (เผื่อไว้ กันเหนียว)

console.log("----- CHECKING PASSWORD -----");
console.log("Password loaded:", process.env.DB_PASS); 
console.log("-----------------------------");


const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,        
  password: process.env.DB_PASS,  
  database: process.env.DB_NAME,    
  
  // (ตั้งค่า SSL ตามไฟล์ .env ของคุณ)
  ssl: process.env.DB_SSL === 'true' 
        ? { rejectUnauthorized: false } 
        : false,

  max: 10, // จำนวน connection สูงสุด
  idleTimeoutMillis: 30000, // (30 วิ) ถ้าว่างเกิน 30 วิ ให้ปิด connection ทิ้งซะ (Supabase ตัดที่ 60 วิ เราชิงตัดก่อน)
  connectionTimeoutMillis: 2000, // ถ้าต่อไม่ได้ภายใน 2 วิ ให้เลิกพยายาม
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
