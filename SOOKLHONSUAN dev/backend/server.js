// server.js (แก้ไขครั้งที่ 2)

require('dotenv').config();
const path = require("path");
const express = require("express");

const app = require("./app"); 

const PORT = process.env.PORT || 4000;

// โฟลเดอร์ build ของ Vite
const frontendBuildPath = path.join(__dirname, "frontend", "vite-project", "dist"); 

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
    res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});