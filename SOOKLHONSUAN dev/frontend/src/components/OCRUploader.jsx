import React, { useState } from "react";
import { uploadImage } from "../api/upload";
import imageCompression from 'browser-image-compression'; // 💡 เพิ่มการ import ไลบรารีบีบอัด

export default function OCRUploader() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false); // 💡 เพิ่ม State สำหรับ Loading

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true); // เริ่ม Loading
    setResult("⏳ กำลังบีบอัดและอัปโหลดภาพ...");

    try {
        // 1. ตั้งค่าการบีบอัดภาพ (Resize & Compress)
        const options = {
            maxSizeMB: 1, // กำหนดขนาดสูงสุด 1 MB
            maxWidthOrHeight: 1024, // กำหนดความละเอียดสูงสุด 1024px
            useWebWorker: true, // ใช้ Web Worker เพื่อไม่ให้ UI ค้าง
        };

        // 2. ทำการบีบอัดไฟล์ (นี่คือส่วนที่ต้องใช้เวลาเล็กน้อย)
        const compressedFile = await imageCompression(file, options); 

        setResult(`⏳ อัปโหลดไฟล์ที่บีบอัดแล้ว (${(compressedFile.size / 1024 / 1024).toFixed(2)} MB)...`);
        
        // 3. เรียก API ด้วยไฟล์ที่บีบอัดแล้ว
        const res = await uploadImage(compressedFile);

        // 4. แสดงผลลัพธ์
        setResult(
          res?.markdown ||
          res?.raw?.markdown || 
          res?.text ||
          JSON.stringify(res, null, 2)
        );

    } catch (error) {
      console.error("OCR Extract Error:", error);
      setResult("❌ OCR Failed: " + error.message);
    } finally {
        setLoading(false); // สิ้นสุด Loading
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>OCR Extractor</h2>

      <input 
            type="file" 
            accept="image/*" 
            onChange={handleUpload} 
            disabled={loading} // 💡 ปิดปุ่มระหว่าง Loading
        />
        {/* 💡 แสดงสถานะ Loading เมื่อกำลังทำงาน */}
        {loading && <p style={{ color: 'blue' }}>กำลังประมวลผล... โปรดรอสักครู่</p>}

      <pre style={{
        marginTop: 20,
        background: "#eee",
        padding: 20,
        borderRadius: 8,
        whiteSpace: "pre-wrap",
        fontSize: 14,
      }}>
        {result}
      </pre>
    </div>
  );
}