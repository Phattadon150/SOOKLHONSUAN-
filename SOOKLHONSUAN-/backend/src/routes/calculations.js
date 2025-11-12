const express = require('express');
const router = express.Router();

let requireAuth;
try {
  requireAuth = require('../middleware/auth');
} catch {
  requireAuth = (req, res, next) => next();
}

const calc = require('../controllers/calculation.Controller');

// Preview: คำนวณอย่างเดียว (ไม่บันทึก)
router.post('/preview', requireAuth, calc.previewCalculation);

// Create: คำนวณ (ถ้ายังไม่ส่งค่า) + บันทึกลงตาราง calculations
router.post('/', requireAuth, calc.createCalculation);

module.exports = router;
