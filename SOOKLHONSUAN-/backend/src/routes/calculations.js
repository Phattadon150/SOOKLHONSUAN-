const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // 👈 ตรวจสอบว่า path ถูกต้อง

// อิมพอร์ตฟังก์ชันทั้งหมดจาก Controller
const { 
  previewCalculation, 
  createCalculation, 
  getCalculationsByUser  // 👈 ต้องมีตัวนี้
} = require('../controllers/calculation.Controller');

// ⭐️ 1. GET /api/calculations (สำหรับหน้า Dashboard)
// (นี่คือ Route ที่ไฟล์ของคุณขาดไป)
router.get('/', authMiddleware, getCalculationsByUser);

// 2. POST /api/calculations (สำหรับหน้า Summary ใช้บันทึก)
router.post('/', authMiddleware, createCalculation);

// 3. POST /api/calculations/preview (สำหรับหน้า Calculate ใช้คำนวณ)
router.post('/preview', authMiddleware, previewCalculation);

module.exports = router;