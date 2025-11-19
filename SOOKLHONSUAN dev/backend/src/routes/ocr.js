const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const upload = multer({ dest: "uploads/" });

// ⭐ แก้เฉพาะตรงนี้ — โมเดลที่ถูกต้องจริง
const MODEL_NAME = "gemini-2.5-flash";

// ฟังก์ชัน sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// OCR API
router.post("/extract", upload.single("image"), async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!filePath) throw new Error("No image file uploaded");

    const imgBase64 = fs.readFileSync(filePath, { encoding: "base64" });

    // Retry 3 ครั้ง (คงของเดิม)
    let response = null;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await sleep(1200 * attempt);
        }

        response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
          {
            contents: [
              {
                parts: [
                  { text: "อ่านข้อความจากภาพแบบ OCR เป็นภาษาไทยเท่านั้น" },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: imgBase64,
                    },
                  },
                ],
              },
            ],
          }
        );

        break;
      } catch (err) {
        const status = err.response?.status;

        if (
          attempt < maxRetries - 1 &&
          (status >= 500 || status === 429 || err.message.includes("overloaded"))
        ) {
          continue;
        }

        throw err;
      }
    }

    if (!response) throw new Error("OCR failed after retries");

    let text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";


    // ================================
    //  🟡 ภาพไม่ชัด — ถาม Gemini เพิ่มความแม่นยำ
    // ================================
    const blurCheck = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `จงตอบว่า "ชัด" หรือ "ไม่ชัด" เท่านั้น  
ข้อความต่อไปนี้อ่านออกหรือไม่:  
"${text}"`,
              },
            ],
          },
        ],
      }
    );

    const blurResult =
      blurCheck.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (blurResult.includes("ไม่ชัด")) {
      return res.json({
        success: false,
        message: "ภาพไม่ชัด กรุณาถ่ายใหม่ชัดๆ ครับ",
      });
    }


    // ================================
    //  🟢 ตรวจข้อมูลเกษตร แต่ไม่ตัดข้อความทิ้ง
    // ================================
    const agriKeywords = [
      "ตัน",
      "กิโล",
      "บาท",
      "ลำไย",
      "เกษตร",
      "ผลผลิต",
      "ราคา",
      "สวน",
      "ปุ๋ย",
      "รายรับ",
      "รายจ่าย",
      "ต้นทุน",
    ];

    const foundAgri = agriKeywords.some((k) => text.includes(k));

    if (!foundAgri) {
      return res.json({
        success: false,
        message: "ไม่พบข้อมูลการเกษตรในภาพนี้",
        text,
      });
    }


    // ================================
    // ส่งผลลัพธ์จริง (ของเดิมพี่)
    // ================================
    return res.json({
      success: true,
      markdown: text,
    });

  } catch (err) {
    console.error("OCR ERROR:", err);
    return res.status(500).json({
      success: false,
      detail: err.response?.data || err.message,
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

module.exports = router;
