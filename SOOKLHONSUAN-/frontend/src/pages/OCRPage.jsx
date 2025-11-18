// src/pages/OCRPage.jsx

import { useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { uploadImage } from "../lib/ocr/upload"; // ⭐ ใช้ API จริงของคุณ

export default function OCRPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [ocrResult, setOcrResult] = useState("ผลลัพธ์ข้อความที่สแกนจะปรากฏที่นี่...");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setOcrResult("กดปุ่ม 'สแกน' เพื่อเริ่มประมวลผล...");
      setError("");
    } else {
      setSelectedFile(null);
      setImagePreviewUrl("");
      setOcrResult("กรุณาเลือกรูปภาพที่ถูกต้อง");
      setError("ไฟล์ไม่ใช่รูปภาพ");
    }
  };

  const handleFileChange = useCallback((event) => {
    processFile(event.target.files[0]);
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    processFile(file);
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const runOCR = useCallback(async () => {
    if (!selectedFile) {
      setError("กรุณาเลือกรูปภาพก่อนทำการสแกน");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setOcrResult("กำลังประมวลผล OCR...");

      // ⭐ OCR จริง
      const result = await uploadImage(selectedFile);
      setOcrResult(result.markdown || result.text || "ไม่พบข้อความ");

    } catch (err) {
      setError("เกิดข้อผิดพลาดในการประมวลผล OCR");
      setOcrResult("OCR Error");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ocrResult);
    setError("คัดลอกแล้ว!");
    setTimeout(() => setError(""), 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-bold text-green-900 mb-6">
          📄 สแกนภาพเพื่อแปลงเป็นข้อความ
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-8 rounded-2xl shadow-md">

          {/* LEFT: Upload + Preview */}
          <div className="space-y-5">

            <h2 className="text-lg font-semibold text-green-800">
              อัปโหลดรูปภาพ หรือ ลากมาวาง
            </h2>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl h-48 flex flex-col justify-center items-center cursor-pointer transition 
                ${isDragging ? "border-green-700 bg-green-50" : "border-gray-300 bg-gray-100 hover:bg-gray-200"}
              `}
              onClick={() => document.getElementById("upload").click()}
            >
              <input
                id="upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <p className="font-semibold text-gray-700">
                {isDragging ? "ปล่อยไฟล์เพื่ออัปโหลด" : "ลากไฟล์มาวาง หรือคลิกเพื่อเลือก"}
              </p>
              <p className="text-sm text-gray-500">รองรับ JPG, PNG สูงสุด 5MB</p>
            </div>

            {/* Preview */}
            {imagePreviewUrl && (
              <div className="p-3 bg-gray-100 rounded-xl border border-gray-300 max-h-80 overflow-y-auto">
                <img src={imagePreviewUrl} className="rounded-lg shadow" />
              </div>
            )}

            <button
              onClick={runOCR}
              disabled={!selectedFile || isLoading}
              className={`w-full py-3 rounded-xl text-white font-bold shadow-md transition ${
                !selectedFile || isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isLoading ? "กำลังสแกน..." : "สแกนและแปลงเป็นข้อความ"}
            </button>
          </div>

          {/* RIGHT: OCR Result */}
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-green-800">ผลลัพธ์</h2>

            <textarea
              value={ocrResult}
              readOnly
              className="w-full h-96 p-4 bg-gray-100 border border-gray-300 rounded-xl resize-none shadow-inner"
            />

            <button
              onClick={copyToClipboard}
              disabled={ocrResult.startsWith("ผลลัพธ์") || isLoading}
              className="w-full py-3 bg-lime-500 hover:bg-lime-600 text-green-900 font-bold rounded-xl shadow"
            >
              คัดลอกข้อความ
            </button>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
