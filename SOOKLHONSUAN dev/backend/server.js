// server.js (แก้ไข COOP Policy)

require('dotenv').config();
const path = require("path");
const express = require("express");

const app = require("./app"); 

const PORT = process.env.PORT || 4000;

// โฟลเดอร์ build ของ Vite
const frontendBuildPath = path.join(__dirname, "frontend", "vite-project", "dist"); 

// ===============================
// 🛡️ MIDDLEWARE: แก้ไข Cross-Origin-Opener-Policy (COOP)
// ===============================
// การตั้งค่านี้จะอนุญาตให้ Pop-up/Iframe ที่ถูกเปิดโดยหน้านี้ 
// สามารถใช้ window.postMessage() สื่อสารกลับมาได้โดยไม่ถูกบล็อก
app.use((req, res, next) => {
    res.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
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

// React Router Fallback (รองรับทุกหน้า SPA)
// 💡 แก้ไข: ใช้ Regular Expression (/.* /) แทน '*' หรือ '/*' เพื่อเลี่ยง PathError
app.get(/\/(.*)/, (req, res) => {
    // ต้องตั้งค่า COOP Header ซ้ำในส่วนนี้ด้วย เพื่อให้แน่ใจว่า index.html ได้รับ Header นี้
    res.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});