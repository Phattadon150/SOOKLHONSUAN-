import React, { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"; 
import { uploadImage } from "../lib/ocr/upload"; // ⚠️ เช็ค path ให้ตรงกับโปรเจกต์จริงของคุณนะครับ

export default function OCRPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  
  // 1. ocrResult เอาไว้โชว์ข้อความสวยๆ ให้คนอ่าน
  const [ocrResult, setOcrResult] = useState(""); 
  
  // 2. ⭐ storedJson เอาไว้เก็บข้อมูลดิบ (JSON) เพื่อส่งไปหน้าถัดไป (User มองไม่เห็นอันนี้)
  const [storedJson, setStoredJson] = useState(null); 

  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);

  const navigate = useNavigate();
  const { farmId } = useParams(); 

  // =============================
  // CAMERA & UPLOAD LOGIC
  // =============================
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play();
      }
      setCameraOn(true); 
    } catch (err) {
      alert("เปิดกล้องไม่ได้: " + err.message);
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video) return alert("กล้องยังไม่พร้อม");
    await new Promise((res) => requestAnimationFrame(res));
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (!blob) return alert("ถ่ายรูปไม่สำเร็จ");
      const file = new File([blob], "camera.jpg", { type: "image/jpeg" });
      processFile(file);
      
      const stream = video.srcObject;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setCameraOn(false); 
    }, "image/jpeg", 0.95);
  };

  const processFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setOcrResult(""); 
      setStoredJson(null); // เคลียร์ค่าเก่าเมื่อเลือกรูปใหม่
    }
  };

  // =============================
  // ⭐ RUN OCR (แก้ไขใหม่)
  // =============================
  const runOCR = async () => {
    if (!selectedFile) return alert("กรุณาเลือกรูปหรือถ่ายรูปก่อน");
    setIsLoading(true);
    setOcrResult("⏳ กำลังประมวลผล...");
    
    try {
        const res = await uploadImage(selectedFile);
        
        // ⭐ 1. Console Log เพื่อการ DEBUG ตามที่ขอ
        console.log("🔴 [DEBUG] OCR Raw Response:", res);

        // ⭐ 2. ตรวจสอบว่ามี data (JSON) กลับมาไหม
        if (res.data && typeof res.data === 'object') {
            // 2.1 เก็บ JSON ตัวจริงไว้ในตัวแปรลับ (storedJson)
            setStoredJson(res.data);
            console.log("✅ [DEBUG] Stored JSON successfully:", res.data);

            // 2.2 แปลงเป็นข้อความภาษาคน เพื่อแสดงบนหน้าจอ
            // (ใช้ Template Literal จัดรูปแบบให้อ่านง่าย)
            const readableText = `
📍 ข้อมูลที่อ่านได้จากภาพ:
-------------------------
• จังหวัด:  ${res.data.location || "ไม่ระบุ"}
• พื้นที่:    ${res.data.area_rai || "-"} ไร่
• อายุต้น:   ${res.data.tree_age_avg || "-"} ปี
• เดือนเก็บ: ${res.data.harvest_month || "-"}
• คุณภาพ:   ${res.data.quality || "ปานกลาง"}

(ข้อมูลนี้ถูกบันทึกแล้ว กดปุ่มยืนยันด้านล่างเพื่อดำเนินการต่อ)
            `.trim();

            setOcrResult(readableText);

        } else {
            // กรณี Backend ส่งมาแต่ Text หรือ Error
            console.warn("⚠️ [DEBUG] No JSON data found, falling back to text.");
            setOcrResult(res.markdown || res.text || "❌ ไม่พบข้อมูลรูปแบบ JSON");
        }

    } catch (error) {
        console.error("❌ [DEBUG] OCR Failed:", error);
        setOcrResult("❌ Error: " + error.message);
    } finally {
        setIsLoading(false);
    }
  };

  // =============================
  // ⭐ SUBMIT DATA (แก้ไขใหม่)
  // =============================
  const handleSubmitManualData = () => {
    // กรณีที่ยังไม่ได้สแกน หรือสแกนไม่ผ่าน
    if (!storedJson) {
      const confirm = window.confirm("⚠️ ยังไม่มีข้อมูลจากการสแกน (JSON) คุณต้องการไปหน้าคำนวณเพื่อกรอกเองทั้งหมดหรือไม่?");
      if (confirm) {
        navigate(`/farm/${farmId}/calculate`);
      }
      return;
    }

    // ⭐ ส่ง JSON ตัวจริงที่แอบเก็บไว้ ไปหน้า Calculate
    console.log("🚀 [DEBUG] Navigating with Data:", storedJson);
    
    navigate(`/farm/${farmId}/calculate`, { 
        state: { preloadData: storedJson } 
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto p-6 w-full">
        <div className="bg-white p-6 rounded-3xl shadow-xl">
          <h1 className="text-3xl font-bold text-green-900 mb-6 text-center">
            สแกนเอกสารการเกษตร
          </h1>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ฝั่งซ้าย: กล้องและอัปโหลด (เหมือนเดิม) */}
            <div className="lg:w-2/5 space-y-5">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => processFile(e.target.files[0])}
                className="border p-3 rounded-xl w-full cursor-pointer"
              />

              {!cameraOn && (
                <button onClick={startCamera} className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition">
                  📸 เปิดกล้อง
                </button>
              )}

              <div className={cameraOn ? "block" : "hidden"}>
                  <div className="relative rounded-xl overflow-hidden bg-black shadow-lg mb-4">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto object-contain" />
                  </div>
                  <canvas ref={canvasRef} className="hidden"></canvas>
                  <button onClick={capturePhoto} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 shadow-md transition">
                    ✔ ถ่ายรูป
                  </button>
              </div>

              {imagePreviewUrl && !cameraOn && (
                <div className="mt-4">
                    <p className="mb-2 text-gray-600 text-sm">รูปตัวอย่าง:</p>
                    <img src={imagePreviewUrl} className="rounded-xl shadow-lg border w-full object-contain max-h-64 bg-gray-100" alt="preview" />
                </div>
              )}

              <button
                onClick={runOCR}
                disabled={!selectedFile || isLoading || cameraOn}
                className={`w-full py-3 rounded-xl font-bold transition shadow-md ${
                    (!selectedFile || isLoading || cameraOn) 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "bg-gray-800 text-white hover:bg-black"
                }`}
              >
                {isLoading ? "⏳ กำลังประมวลผล AI..." : "🔍 เริ่มสแกนภาพ"}
              </button>
            </div>

            {/* ฝั่งขวา: แสดงผลเป็น Text แต่เก็บ JSON */}
            <div className="lg:w-3/5 flex flex-col h-full">
              <h2 className="text-xl font-bold text-green-900 mb-2">
                ผลลัพธ์การสแกน
              </h2>
              
              <textarea
                value={ocrResult}
                readOnly // ⭐ ล็อคไว้ให้อ่านอย่างเดียว ผู้ใช้จะได้ไม่เผลอแก้ Text แล้วนึกว่าแก้ข้อมูล
                placeholder='ผลลัพธ์สรุปจะแสดงที่นี่...'
                className="flex-1 min-h-[300px] w-full border border-gray-300 p-4 rounded-xl bg-gray-100 shadow-inner font-mono text-base focus:outline-none text-gray-800"
              />

              <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-green-800">
                  * โปรดตวรจสอบข้อมูลให้ถูกต้องก่อนนำข้อมูลไปเติม
                </div>
                
                <button
                  onClick={handleSubmitManualData}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow transition flex items-center gap-2"
                >
                  ✅ นำข้อมูลไปเติม
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}