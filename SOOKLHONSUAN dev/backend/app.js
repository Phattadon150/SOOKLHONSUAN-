require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ⭐️ 1. ตรวจสอบ Path 2 บรรทัดนี้ให้ถูกต้อง
// (เช่น ถ้า db.js อยู่ใน 'src' ก็ใช้ './src/db')
const pool = require('./src/db'); 
// (เช่น ถ้า auth.js อยู่ใน 'src/middleware')
const auth = require('./src/middleware/auth'); 

const app = express();
app.use(express.json());

// --- การตั้งค่า CORS (ถูกต้องแล้ว) ---
const corsOptions = {
  origin: 'http://localhost:5173' 
};
app.use(cors(corsOptions)); 

// --- Routes ---
const authRoutes = require('./src/routes/auth');
const farmRoutes = require('./src/routes/farm');
const cropTypeRoutes = require('./src/routes/cropTypes');
const userRoutes = require('./src/routes/user');
const calculationRoutes = require('./src/routes/calculations');

// --- ⭐️ 2. การใช้งาน Routes (นี่คือจุดที่แก้ไข) ⭐️ ---

// ✅ Routes สาธารณะ (ไม่ต้องใช้ auth)
// (Login, Register)
app.use('/api/auth', authRoutes); 
// (หน้า FarmForm ต้องใช้ดึงรายชื่อพืช)
app.use('/api/crop-types', cropTypeRoutes); 

// 🔐 Routes ที่ต้อง Login (ต้องใช้ auth)
// (นี่คือสาเหตุที่หน้า Calculate บอก "ไม่พบฟาร์ม" เพราะก่อนหน้านี้ลืมใส่ auth)
app.use('/api/farms', auth, farmRoutes); 
app.use('/api/users', auth, userRoutes); 
app.use('/api/calculations', auth, calculationRoutes);

// ... (อาจจะมี testdb หรืออื่นๆ) ...

module.exports = app;