require('dotenv').config();
const { Pool } = require('pg');

// ตั้งค่า Database (ใช้ค่าจาก .env ของคุณ)
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Mapping: ชื่อพืช -> ID ในตาราง crop_types
const CROP_MAPPING = {
  'ลำไย': 1,
  'ทุเรียน': 2,
  'มะม่วง': 3,
  'มังคุด': 4,
  'ยางพารา': 5,
  'ปาล์มน้ำมัน': 6,
  'ข้าว': 7,
  'อ้อย': 8,
  'มันสำปะหลัง': 9
};

// ฟังก์ชันสุ่มราคาตามช่วง (จำลองราคาตลาดจริง)
const getRandomPrice = (min, max) => {
  return (Math.random() * (max - min) + min).toFixed(2);
};

const fetchAndSavePrices = async () => {
  console.log('📡 [Script] เริ่มต้นกระบวนการดึงราคากลาง...');
  
  try {
    const today = new Date().toISOString().split('T')[0]; // วันที่ปัจจุบัน (YYYY-MM-DD)
    
    // จำลองข้อมูลราคาตลาด (Real-time Simulation)
    // ในอนาคตคุณสามารถเปลี่ยนตรงนี้เป็นการเรียก axios.get('MOC_API_URL') ได้
    const marketData = [
      { name: 'ลำไย', min: 35, max: 45 },       // ราคาช่วง 35-45 บาท
      { name: 'ทุเรียน', min: 120, max: 160 },  // ราคาช่วง 120-160 บาท
      { name: 'มะม่วง', min: 25, max: 40 },
      { name: 'มังคุด', min: 30, max: 50 },
      { name: 'ยางพารา', min: 45, max: 60 },
      { name: 'ปาล์มน้ำมัน', min: 5, max: 8 },
      { name: 'ข้าว', min: 12, max: 15 },
      { name: 'อ้อย', min: 1, max: 2 },
      { name: 'มันสำปะหลัง', min: 2, max: 4 }
    ];

    console.log(`📅 ประจำวันที่: ${today}`);

    for (const item of marketData) {
      const cropId = CROP_MAPPING[item.name];
      
      if (cropId) {
        // สุ่มราคาในวันนี้
        const priceAvg = getRandomPrice(item.min, item.max);
        const priceMin = (priceAvg * 0.9).toFixed(2);
        const priceMax = (priceAvg * 1.1).toFixed(2);

        // บันทึกลง Supabase
        await pool.query(`
          INSERT INTO market_prices 
            (crop_type_id, price_avg, price_min, price_max, unit, source, effective_date)
          VALUES 
            ($1, $2, $3, $4, 'THB/kg', 'Market Data (Simulated)', $5)
          ON CONFLICT (crop_type_id, province, effective_date) 
          DO UPDATE SET 
            price_avg = EXCLUDED.price_avg,
            price_min = EXCLUDED.price_min,
            price_max = EXCLUDED.price_max,
            source = EXCLUDED.source;
        `, [cropId, priceAvg, priceMin, priceMax, today]);

        console.log(`✅ อัปเดตราคา: ${item.name} (ID:${cropId}) = ${priceAvg} บาท/กก.`);
      }
    }

    console.log('🎉 ดึงและบันทึกราคาเสร็จสมบูรณ์!');

  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาด:', err.message);
  }
};

// ส่งออกฟังก์ชัน
module.exports = { fetchAndSavePrices };

// ถ้าสั่งรันไฟล์นี้โดยตรง ให้ทำงานเลย (สำหรับการทดสอบ Manual)
if (require.main === module) {
  fetchAndSavePrices().then(() => pool.end());
}