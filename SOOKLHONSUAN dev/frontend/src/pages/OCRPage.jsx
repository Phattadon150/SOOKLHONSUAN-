import React, { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { uploadImage } from "../lib/ocr/upload";

export default function OCRPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [ocrResult, setOcrResult] = useState("ผลลัพธ์ข้อความที่สแกนจะปรากฏที่นี่...");
  const [isLoading, setIsLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // 🔥 START CAMERA (เวอร์ชันที่ใช้ได้จริง)
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      if (!videoRef.current) {
        console.log("VIDEO ยังไม่พร้อม");
        return;
      }

      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };

      setCameraOn(true);
    } catch (err) {
      alert("เปิดกล้องไม่ได้: " + err.message);
    }
  };

  // 🔥 CAPTURE PHOTO
  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video) return alert("กล้องยังไม่พร้อม");

    // รอเฟรมแรก (มือถือจำเป็นมาก)
    await new Promise((res) => requestAnimationFrame(res));

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.95)
    );

    if (!blob) return alert("ถ่ายภาพไม่สำเร็จ");

    const file = new File([blob], "camera.jpg", { type: "image/jpeg" });

    setSelectedFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));

    // ปิด stream
    const stream = video.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setCameraOn(false);
  };

  // 🔥 RUN OCR
  const runOCR = async () => {
    if (!selectedFile) return alert("กรุณาเลือกรูปหรือถ่ายรูปก่อน");

    setIsLoading(true);

    const res = await uploadImage(selectedFile);
    setOcrResult(res.markdown || res.text || JSON.stringify(res, null, 2));

    setIsLoading(false);
  };

  // 📤 Process File from gallery
  const processFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setOcrResult("กดปุ่มสแกนเพื่อเริ่มประมวลผล...");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto p-8 bg-white mt-10 rounded-3xl shadow-xl">
        <h1 className="text-3xl font-bold text-green-900 mb-6 text-center">
          สแกนภาพเพื่อแปลงเป็นข้อความ (OCR)
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT */}
          <div className="lg:w-2/5 space-y-5">

            {/* File Upload */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => processFile(e.target.files[0])}
              className="border p-3 rounded-xl w-full cursor-pointer"
            />

            {/* Camera Button */}
            {!cameraOn && (
              <button
                onClick={startCamera}
                className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800"
              >
                📸 เปิดกล้อง
              </button>
            )}

            {/* Video ALWAYS rendered */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`rounded-xl w-full bg-black ${cameraOn ? "" : "hidden"}`}
            />

            <canvas ref={canvasRef} className="hidden"></canvas>

            {cameraOn && (
              <button
                onClick={capturePhoto}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600"
              >
                ✔ ถ่ายรูป & ใช้ภาพนี้
              </button>
            )}

            {/* Image Preview */}
            {imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                className="rounded-xl shadow-lg border"
                alt="preview"
              />
            )}

            {/* OCR Button */}
            <button
              onClick={runOCR}
              disabled={!selectedFile || isLoading}
              className="w-full bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-800 disabled:bg-gray-400"
            >
              {isLoading ? "กำลังสแกน..." : "สแกนและแปลงเป็นข้อความ"}
            </button>
          </div>

          {/* RIGHT */}
          <div className="lg:w-3/5">
            <h2 className="text-xl font-bold text-green-900 mb-2">ผลลัพธ์</h2>
            <textarea
              value={ocrResult}
              readOnly
              className="w-full h-[420px] border p-4 rounded-xl bg-gray-50 shadow-inner"
            ></textarea>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
