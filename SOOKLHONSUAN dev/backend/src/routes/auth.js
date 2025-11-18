// backend/src/routes/auth.js
// (ใช้ไฟล์ auth_Google.js)

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/google', authController.googleLogin);
router.post('/google/complete', authController.googleCompleteSignup);

router.get('/check-username', authController.checkUsername);

// ⭐️ เพิ่ม: Route นี้จำเป็นสำหรับ /api/users/me
router.get('/me', authController.getMe); 
// หมายเหตุ: ถ้าคุณมี /api/users/me อยู่แล้ว ก็ไม่จำเป็นต้องเพิ่มบรรทัดนี้
// แต่จากไฟล์ app.js ดูเหมือนคุณจะยังไม่มี route /me ครับ

module.exports = router;