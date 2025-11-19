// server.js

require('dotenv').config();
const path = require("path");
const express = require("express");
const cors = require("cors"); // แนะนำให้เพิ่ม cors หากยังไม่มี

const app = require("./app"); 

const PORT = process.env.PORT || 4000;

// โฟลเดอร์ build ของ Vite
const frontendBuildPath = path.join(__dirname, "frontend", "vite-project", "dist"); 

// ===============================
// 🛡️ MIDDLEWARE: แก้ไข Security Headers
// ===============================
app.use((req, res, next) => {
    // อนุญาตให้หน้าเว็บสื่อสารกับ Popup ได้ทุกกรณี (แก้ปัญหา postMessage blocked)
    res.set('Cross-Origin-Opener-Policy', 'unsafe-none');
    // ปิดการตรวจสอบ Embedder Policy หรือตั้งเป็น unsafe-none
    res.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
});

// ===============================
// Serve Frontend Build (Vite)
// ===============================

if (require('fs').existsSync(frontendBuildPath)) {
    console.log(`Serving Frontend from: ${frontendBuildPath}`);
    app.use(express.static(frontendBuildPath));
} else {
    console.warn("⚠️ Frontend build path not found! Check your Vite build setup.");
}

// React Router Fallback
app.get(/\/(.*)/, (req, res) => {
    res.set('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});