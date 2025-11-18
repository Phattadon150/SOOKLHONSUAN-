import React, { useState } from "react";
import { uploadImage } from "../api/upload";

export default function OCRUploader() {
  const [result, setResult] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await uploadImage(file);

      // 👈👈 จุดที่อ่าน markdown — ตรงนี้แหละ!!
      setResult(
        res?.markdown ||
        res?.raw?.markdown || 
        res?.text ||
        JSON.stringify(res, null, 2)
      );

    } catch (error) {
      console.error("OCR Extract Error:", error);
      setResult("❌ OCR Failed: " + error.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>OCR Extractor</h2>

      <input type="file" accept="image/*" onChange={handleUpload} />

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
