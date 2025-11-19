const pool = require('./db'); // เรียกไฟล์ db connection ของคุณ

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() as current_time');
    console.log('✅ เชื่อมต่อ Supabase สำเร็จ!', res.rows[0]);
  } catch (err) {
    console.error('❌ เชื่อมต่อไม่สำเร็จ:', err);
  }
}

testConnection();