// frontend/vite-project/src/api/upload.js

// 💡 1. ดึงค่า URL จาก Environment Variables (Vite standard)
const NGROK_URL = import.meta.env.VITE_NGROK_URL; 
const LOCALHOST_URL = import.meta.env.VITE_LOCAL_URL;

// ตรวจสอบว่าโค้ดกำลังรันอยู่บน localhost หรือไม่
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// กำหนด BASE_URL ที่ยืดหยุ่น
const BASE_URL = isLocal 
    ? LOCALHOST_URL 
    : NGROK_URL; 

export async function uploadImage(file) {
  const form = new FormData();
  form.append("image", file);

  // 💡 2. ใช้ BASE_URL และ endpoint /api/extract
  const res = await fetch(`${BASE_URL}/api/extract`, {
    method: "POST",
    body: form,
  });

  return await res.json();
}