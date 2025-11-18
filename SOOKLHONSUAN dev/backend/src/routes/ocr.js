// ./src/routes/ocr.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const upload = multer({ dest: "uploads/" });

// ===================== RETRY + FALLBACK ENGINE =====================
async function callGemini(model, body, retry = 3) {
  for (let i = 0; i < retry; i++) {
    try {
      return await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
        body,
        { timeout: 20000 }
      );
    } catch (err) {
      const overload =
        err.response?.status === 503 ||
        err.response?.status === 429 ||
        err.message.includes("overloaded") ||
        err.message.includes("quota");

      if (overload && i < retry - 1) {
        console.log(`⚠️ ${model} overloaded → retry (${i + 1})`);
        await new Promise((res) => setTimeout(res, 1200));
        continue;
      }

      throw err;
    }
  }
}

// =============== OCR API ===============
router.post("/extract", upload.single("image"), async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!filePath) throw new Error("No image file uploaded.");

    const imgBase64 = fs.readFileSync(filePath, "base64");

    // BODY สำหรับ Gemini
    const body = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imgBase64,
              },
            },
            {
              text: "อ่านข้อความทั้งหมดจากภาพนี้ ตอนนี้คุณทำงานแบบ OCR ภาษาไทย ให้ส่งเฉพาะข้อความ",
            },
          ],
        },
      ],
    };

    let response;

    // -------- MODEL หลัก --------
    let model = "gemini-1.5-flash";

    try {
      response = await callGemini(model, body);
    } catch (err) {
      console.log("⛔ Flash fail → fallback เป็น flash-latest");
      model = "gemini-1.5-flash-latest";
      response = await callGemini(model, body);
    }

    // ดึงข้อความ OCR
    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "ไม่พบข้อความในภาพ";

    res.json({
      success: true,
      markdown: text,
      modelUsed: model,
    });
  } catch (err) {
    const errorDetail = err.response?.data || err.message;
    console.error("OCR ERROR:", errorDetail);

    res.status(500).json({
      success: false,
      detail: errorDetail,
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

module.exports = router;
