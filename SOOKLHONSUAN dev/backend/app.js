require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron'); // ✅ 1. เพิ่ม node-cron

// DB + Auth
const pool = require('./src/db');
const auth = require('./src/middleware/auth');

const app = express();
app.use(express.json());

// ======================
// LOG ORIGIN (debug)
// ======================
app.use((req, res, next) => {
  console.log("REQ FROM ORIGIN:", req.headers.origin);
  next();
});

// ======================
// CORS (เวอร์ชันรองรับ NGROK + มือถือ)
// ======================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  ".ngrok-free.app",        // อนุญาตทุก ngrok subdomain
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // mobile camera / curl

      const isAllowed = allowedOrigins.some((o) =>
        origin.includes(o.replace("*", ""))
      );

      if (isAllowed) {
        return callback(null, true);
      } else {
        console.log("❌ CORS BLOCKED:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// ======================
// Routes Imports
// ======================
const authRoutes = require('./src/routes/auth');
const farmRoutes = require('./src/routes/farm');
const cropTypeRoutes = require('./src/routes/cropTypes');
const userRoutes = require('./src/routes/user');
const calculationRoutes = require('./src/routes/calculations');
const ocrRoutes = require('./src/routes/ocr'); // 💡 ไฟล์สำหรับ OCR route
const extractRoutes = require("./src/routes/extract");
const marketPriceRoutes = require('./src/routes/marketPrices'); // ✅ 2. เพิ่ม Route ราคากลาง
// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/crop-types', cropTypeRoutes);
app.use("/api", ocrRoutes);
app.use("/api", extractRoutes);   // ⭐ เพิ่มใหม่

// Protected routes (ต้อง Login)
app.use('/api/farms', auth, farmRoutes);
app.use('/api/users', auth, userRoutes);
app.use('/api/calculations', auth, calculationRoutes);
app.use('/api/market-prices', auth, marketPriceRoutes); // ✅ 3. เปิดใช้งาน Route ราคากลาง

// OCR (ไม่ต้อง login ตามโค้ดเดิมของคุณ)
app.use('/api', ocrRoutes); 


app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});
// ======================
// Cron Job (ตั้งเวลาดึงราคาอัตโนมัติ)
// ======================
// ตั้งเวลา: ทุกวันตอน 08:00 น.
cron.schedule('0 8 * * *', async () => {
  console.log('⏰ Cron Job: เริ่มต้นดึงราคากลางประจำวัน...');
  try {
    // เรียกใช้ฟังก์ชันจากไฟล์ Script
    const script = require('./src/scripts/fetchRealPrices');
    
    // ตรวจสอบว่ามีฟังก์ชันให้เรียกหรือไม่
    if (script && script.fetchAndSavePrices) {
      await script.fetchAndSavePrices();
    } else {
      console.log('⚠️ Warning: ไม่พบฟังก์ชัน fetchAndSavePrices ในไฟล์ script');
    }
  } catch (err) {
    console.error('❌ Cron Job Error:', err);
  }
});

module.exports = app;