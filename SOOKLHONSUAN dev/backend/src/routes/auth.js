// backend/src/routes/auth.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route พื้นฐาน
router.post('/register', authController.register);
router.post('/login', authController.login);

// Route สำหรับ Google Login
router.post('/google', authController.googleLogin);
router.post('/google/complete', authController.googleCompleteSignup);

// Route เช็คชื่อซ้ำ และ ดึงข้อมูลส่วนตัว
router.get('/check-username', authController.checkUsername);
router.get('/me', authController.getMe);

// ⭐️ Route ใหม่สำหรับลืมรหัสผ่าน
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;