import { BASE_URL } from "../api";  
// ^^^ NOTE: ถ้าตำแหน่ง API อยู่ไม่ใช่ที่นี่ ให้บอกพี่ เดี๋ยวแก้ path ให้ถูก

// 📌 อัปโหลดรูปภาพไปที่ backend
export async function uploadImage(file) {
  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`${BASE_URL}/api/extract`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

// 📌 Extract text fields
export async function extractFields(text) {
  const res = await fetch(`${BASE_URL}/api/extract-fields`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  return res.json();
}

