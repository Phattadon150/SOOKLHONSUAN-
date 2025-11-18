import React, { useRef, useState } from "react";
import { uploadImage } from "../api/upload";

export default function OpenCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [capturedBlob, setCapturedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState("");

  // ---------------- START CAMERA ----------------
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      const video = videoRef.current;
      video.srcObject = stream;

      video.onloadedmetadata = () => {
        video.play();
      };
    } catch (err) {
      alert("เปิดกล้องไม่ได้: " + err.message);
    }
  };

  // ---------------- CAPTURE PHOTO ----------------
  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video) return alert("กล้องยังไม่พร้อม");

    // รอ frame ล่าสุดจากกล้องก่อน
    await new Promise((res) => requestAnimationFrame(res));

    // ตั้งขนาด canvas
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // แปลงเป็น blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          alert("ถ่ายภาพไม่สำเร็จ");
          return;
        }

        // ⭐ เก็บไว้รอ process
        setCapturedBlob(blob);

        // ⭐ สร้าง previewURL ให้โชว์ภาพที่ถ่ายได้
        setPreviewUrl(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.95
    );
  };

  // ---------------- PROCESS OCR ----------------
  const processOCR = async () => {
    if (!capturedBlob) return alert("ยังไม่มีภาพที่จะประมวลผล");

    const file = new File([capturedBlob], "photo.jpg", {
      type: "image/jpeg",
    });

    const res = await uploadImage(file);

    setResult(
      res.markdown || res.text || JSON.stringify(res, null, 2)
    );
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <h2>📸 ถ่ายภาพก่อน → ประมวลผลทีหลัง</h2>

      <button onClick={startCamera}>เปิดกล้อง</button>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          marginTop: 10,
          borderRadius: 10,
          background: "#000",
        }}
      />

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <button onClick={capturePhoto} style={{ marginTop: 10 }}>
        📷 ถ่ายรูป
      </button>

      {previewUrl && (
        <>
          <h3>📸 รูปที่ถ่ายได้</h3>
          <img
            src={previewUrl}
            alt="preview"
            style={{ width: "100%", borderRadius: 10, marginTop: 10 }}
          />

          <button
            onClick={processOCR}
            style={{
              marginTop: 15,
              padding: "10px 20px",
              background: "#0984e3",
              color: "#fff",
              borderRadius: 10,
              border: "none",
            }}
          >
            🔍 ประมวลผล OCR
          </button>
        </>
      )}

      {result && (
        <pre
          style={{
            marginTop: 20,
            background: "#eee",
            padding: 20,
            borderRadius: 8,
            whiteSpace: "pre-wrap",
          }}
        >
          {result}
        </pre>
      )}
    </div>
  );
}
