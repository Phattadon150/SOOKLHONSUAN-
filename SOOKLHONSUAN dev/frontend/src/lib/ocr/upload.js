const LOCAL = import.meta.env.VITE_LOCAL_URL;
const NGROK = import.meta.env.VITE_NGROK_URL;

// 📌 ตรวจว่าเป็น dev เครื่องคอมไหม
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// 📌 ถ้าเป็นเครื่องคอม → ใช้ local backend
// 📌 ถ้าเป็นมือถือ (IP 192.168.x.x / 10.x.x.x / 172.x.x.x / undefined) → ใช้ ngrok
const API_URL = isLocalhost ? LOCAL : NGROK;

export async function uploadImage(file) {
  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`${API_URL}/api/extract`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function extractFields(text) {
  const res = await fetch(`${API_URL}/api/extract-fields`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  return res.json();
}
