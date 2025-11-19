// backend/src/routes/auth.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const axios = require("axios");

// =========================
// Routes พื้นฐานของนาย (ของเดิม)
// =========================
router.post('/register', authController.register);
router.post('/login', authController.login);

// Route สำหรับ Google Login แบบ JSON (ของเดิม)
router.post('/google', authController.googleLogin);
router.post('/google/complete', authController.googleCompleteSignup);

// Route เช็คชื่อซ้ำ และ ดึงข้อมูลส่วนตัว (ของเดิม)
router.get('/check-username', authController.checkUsername);
router.get('/me', authController.getMe);

// ⭐️ Route ใหม่สำหรับลืมรหัสผ่าน (ของเดิม)
router.post('/forgot-password', authController.forgotPassword);


// ======================================================
// ⭐⭐ GOOGLE OAUTH BACKEND FLOW (อันใหม่ ปลอดภัย ไม่ทับของเดิม) ⭐⭐
// ======================================================

// 1) เริ่มต้น Google Login → Redirect ไป Google
router.get("/google/start", (req, res) => {
  const redirectUrl =
    "https://accounts.google.com/o/oauth2/v2/auth" +
    `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${process.env.GOOGLE_REDIRECT_URL}` +
    "&response_type=code" +
    "&scope=profile%20email";

  return res.redirect(redirectUrl);
});

// 2) Callback หลังผู้ใช้กดยืนยัน Google
router.get("/google/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Missing Google authorization code.");
  }

  try {
    // แลก token
    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URL,
        grant_type: "authorization_code",
      }
    );

    const accessToken = tokenRes.data.access_token;

    // ดึงข้อมูล user Google
    const userRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const googleUser = userRes.data;

    // 👉 ส่ง email กลับไปหน้า Login เพื่อล็อกอิน/สมัครต่อ
    return res.redirect(
      `http://localhost:5173/login?email=${googleUser.email}`
    );

  } catch (err) {
    console.error("Google OAuth error:", err.response?.data || err);
    return res.status(500).send("Google OAuth failed.");
  }
});

module.exports = router;
