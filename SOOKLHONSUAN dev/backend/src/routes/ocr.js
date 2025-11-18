// ./src/routes/ocr.js (Backend Route Module)

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// ฟังก์ชันสำหรับหน่วงเวลา (sleep)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 💡 OCR endpoint: POST /api/extract
router.post("/extract", upload.single("image"), async (req, res) => {
    const filePath = req.file?.path; // ใช้ optional chaining เพื่อความปลอดภัย

    try {
        if (!filePath) {
            throw new Error("No image file uploaded.");
        }
        
        const imgBase64 = fs.readFileSync(filePath, { encoding: "base64" });

        const MODEL_NAME = "gemini-2.5-flash"; 
        
        let response = null;
        const maxRetries = 3;
        
        // 🛠️ กลไก Retry with Exponential Backoff สำหรับ Model Overloaded
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    // หน่วงเวลาก่อนลองใหม่: 2^1 * 1000ms = 2s, 2^2 * 1000ms = 4s
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`[RETRY] Model Overloaded or failed. Retrying in ${delay / 1000}s... (Attempt ${attempt + 1}/${maxRetries})`);
                    await sleep(delay); 
                }

                // 1. ส่งคำขอไปยัง Google Gemini API
                response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=` + process.env.GOOGLE_API_KEY,
                    {
                        contents: [
                            {
                                parts: [
                                    { text: "อ่านข้อความทั้งหมดจากภาพนี้ เป็นภาษาไทยแบบ OCR" },
                                    { inline_data: { mime_type: "image/jpeg", data: imgBase64 } }
                                ]
                            }
                        ]
                    }
                );
                break; // 💡 ออกจากลูปถ้าสำเร็จ
                
            } catch (innerErr) {
                const status = innerErr.response?.status;
                
                // ตรวจสอบว่าเป็นข้อผิดพลาดที่ควรลองใหม่หรือไม่ (5xx server error, 429 rate limit)
                const isRetryable = status >= 500 || status === 429 || innerErr.message.includes('overloaded');

                if (isRetryable && attempt < maxRetries - 1) {
                    // ถ้ายังไม่ถึงรอบสุดท้ายและเป็น error ที่ลองใหม่ได้ ให้ลองอีกครั้งในลูปถัดไป
                    continue; 
                } else {
                    // ถ้าลองครบแล้ว หรือเป็น error อื่นที่ไม่ควรลองใหม่ (เช่น 400, 404, 401) ให้โยนออกไป
                    throw innerErr; 
                }
            }
        }
        
        // 2. การจัดการผลลัพธ์ (Error Safety Check)
        if (!response) {
            throw new Error("Failed to get response after multiple retries.");
        }
        
        const candidates = response.data?.candidates;
        let text = "";

        if (candidates && candidates.length > 0 && candidates[0].content?.parts?.length > 0) {
            text = candidates[0].content.parts[0].text;
        } else {
            // หากไม่มี candidates หรือโครงสร้างไม่ถูกต้อง
            throw new Error("API response did not contain valid text candidates (Content safety issue or empty response).");
        }

        res.json({ success: true, markdown: text });

    } catch (err) {
        // 3. การจัดการข้อผิดพลาดและส่งกลับไปยัง Frontend
        const errorDetail = err.response?.data || err.message;
        console.error("OCR ERROR:", errorDetail);
        res.status(500).json({ success: false, detail: errorDetail });

    } finally {
        // 4. ลบไฟล์ที่อัปโหลด (ไม่ว่าสำเร็จหรือเกิดข้อผิดพลาด)
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});

module.exports = router;