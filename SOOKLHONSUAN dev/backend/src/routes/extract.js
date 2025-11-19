const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

// Extract fields → JSON schema
router.post("/extract-fields", async (req, res) => {
  const text = req.body.text;

  try {

    const prompt = `
คุณคือระบบสกัดข้อมูลจากข้อความ OCR

ข้อความ:
"${text}"

ให้ตอบเป็น JSON เท่านั้น ห้ามตอบอย่างอื่น:

{
  "crop": "",
  "quantity": "",
  "unit": "",
  "price": "",
  "date": "",
  "notes": ""
}

กติกา:
- ถ้าภาพไม่ชัด ให้ตอบ {"error":"BLUR"}
- ถ้าไม่ใช่ข้อมูลเกษตร ให้ตอบ {"error":"NOT_AGRICULTURE"}
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }
    );

    const output = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    res.json(JSON.parse(output));

  } catch (err) {
    console.log("EXTRACT ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "extract failed" });
  }
});

module.exports = router;
