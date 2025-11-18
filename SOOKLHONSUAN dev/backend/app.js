// app.js (Backend)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// DB + Auth (ส่วนที่เกี่ยวข้องกับระบบหลักของคุณ)
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
  ".ngrok-free.app",        // อนุญาตทุก ngrok subdomain
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
// Routes
// ======================
const authRoutes = require('./src/routes/auth');
const farmRoutes = require('./src/routes/farm');
const cropTypeRoutes = require('./src/routes/cropTypes');
const userRoutes = require('./src/routes/user');
const calculationRoutes = require('./src/routes/calculations');
const ocrRoutes = require('./src/routes/ocr'); // 💡 ไฟล์สำหรับ OCR route

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/crop-types', cropTypeRoutes);

// Protected routes
app.use('/api/farms', auth, farmRoutes);
app.use('/api/users', auth, userRoutes);
app.use('/api/calculations', auth, calculationRoutes);

// OCR (ไม่ต้อง login)
app.use('/api', ocrRoutes); // 💡 ทำให้ OCR endpoint คือ /api/extract

module.exports = app;