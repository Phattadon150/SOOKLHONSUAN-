const express = require('express');
const router = express.Router();
// ⭐️ 1. path ไปยัง middleware ของคุณคือ 'auth.js' ไม่ใช่ 'authMiddleware.js'
// (เช็กให้แน่ใจว่าไฟล์ 'auth.js' อยู่ใน 'backend/src/middleware/')
const authMiddleware = require('../middleware/auth'); 

// ⭐️ 2. ลบ 'require' ที่ซ้ำซ้อนและผิด
// (ลบบรรทัด 'const calculationController = require('../controllers/calculationController');' ทิ้งไป)

// ⭐️ 3. อิมพอร์ตฟังก์ชันทั้งหมดจาก Controller ที่ถูกต้อง ('calculation.Controller.js')
const { 
  previewCalculation, 
  createCalculation, 
  getCalculationsByUser,
  deleteCalculation,
  updateCalculation
} = require('../controllers/calculation.Controller');

// ⭐️ 4. กำหนด Route ทั้งหมดให้เรียกใช้ฟังก์ชันที่อิมพอร์ตมา
// GET /api/calculations (สำหรับหน้า Dashboard / History)
router.get('/', authMiddleware, getCalculationsByUser);

// POST /api/calculations (สำหรับหน้า Summary ใช้บันทึก)
router.post('/', authMiddleware, createCalculation);

// POST /api/calculations/preview (สำหรับหน้า Calculate ใช้คำนวณ)
router.post('/preview', authMiddleware, previewCalculation);

// DELETE /api/calculations/:id (สำหรับลบรายการคำนวณ)
router.delete('/:id', authMiddleware, deleteCalculation); 

router.put('/:id', authMiddleware, updateCalculation);

module.exports = router;