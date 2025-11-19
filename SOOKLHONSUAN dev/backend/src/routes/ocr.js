const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const upload = multer({ dest: "uploads/" });

// ใช้โมเดลที่คุณมี
const MODEL_NAME = "gemini-2.0-flash"; 

// ฟังก์ชันช่วยรอ
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

router.post("/extract", upload.single("image"), async (req, res) => {
  const filePath = req.file?.path;
console.log("Check API Key:", process.env.GOOGLE_API_KEY);
  try {
    if (!filePath) throw new Error("No image file uploaded");

    const imgBase64 = fs.readFileSync(filePath, { encoding: "base64" });

    // ⭐ PROMPT ใหม่: สั่งให้ AI คืนค่าเป็น JSON เท่านั้น
    const promptText = `
      Analyze this image related to a Longan farm or agricultural receipt.
      Extract the following data and return it strictly as a JSON object. 
      Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
      
      Fields required:
      1. "location": (String) Province name in Thai (e.g., "เชียงใหม่", "ลำพูน"). If not found, return null.
      2. "area_rai": (Number) The size of the land in Rai. If not found, return null.
      3. "tree_age_avg": (Number) The average age of trees in years. If not found, return null.
      4. "harvest_month": (Number) The month of harvest (1-12). If not found, return null.
      5. "quality": (String) Quality grade, choose strictly one of ["ดีมาก", "ปานกลาง", "ต่ำ"]. Default to "ปานกลาง" if unknown.

      If specific numbers aren't found, try to infer from context, otherwise use null.
    `;

    let response = null;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) await sleep(1000 * attempt);

        response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
          {
            contents: [{
              parts: [
                { text: promptText },
                { inline_data: { mime_type: "image/jpeg", data: imgBase64 } },
              ],
            }],
          }
        );
        break;
      } catch (err) {
        if (attempt === maxRetries - 1) throw err;
      }
    }

    if (!response) throw new Error("OCR failed after retries");

    let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Clean up: ลบ Backticks ออกเผื่อ AI ใส่มา
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let jsonResult;
    try {
      jsonResult = JSON.parse(text);
    } catch (e) {
      // ถ้า Parse ไม่ได้จริงๆ ให้ใส่เป็น raw text ไว้ใน field อื่นแทน
      jsonResult = { raw_text: text };
    }

    // ส่งกลับทั้ง JSON Object (data) และ String (markdown)
    return res.json({
      success: true,
      data: jsonResult,
      markdown: JSON.stringify(jsonResult, null, 2),
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