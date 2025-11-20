// frontend/src/CompleteGoogleSignup.jsx (ไฟล์ใหม่)

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "../components/Modal"; // (Import Modal ของคุณ)
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function CompleteGoogleSignup() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. ดึง tempToken และ profile ที่ส่งมาจากหน้า Login
  const { tempToken, profile } = location.state || {};
  
  const [username, setUsername] = useState("");
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // 2. ถ้าไม่มี tempToken ให้เด้งกลับหน้า Login
  useEffect(() => {
    if (!tempToken || !profile) {
      console.error("No tempToken or profile found, redirecting to login.");
      navigate("/login");
    }
  }, [tempToken, profile, navigate]);

  const handleCloseModal = () => {
    if (modal.type === 'success') {
      navigate("/"); // สมัครและ Login สำเร็จ -> ไปหน้าแรก
    }
    setModal({ isOpen: false, title: '', message: '', type: 'info' });
  };

  // 3. ฟังก์ชันส่งข้อมูลไป Backend (Endpoint /google/complete)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.length < 3) {
      setModal({ isOpen: true, title: "ข้อผิดพลาด", message: "Username ต้องมีอย่างน้อย 3 ตัวอักษร", type: 'error' });
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/auth/google/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        setModal({ isOpen: true, title: "สมัครไม่สำเร็จ", message: data.error || "Username นี้อาจถูกใช้แล้ว", type: 'error' });
        return;
      }

      // 4. สมัครสำเร็จ! (Backend จะส่ง token และ user กลับมา)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("username", data.user.username);

      setModal({
        isOpen: true,
        title: "ลงทะเบียนสำเร็จ!",
        message: `ยินดีต้อนรับ ${data.user.firstname} ${data.user.lastname}`,
        type: 'success'
      });

    } catch (error) {
      console.error("Complete signup error:", error);
      setModal({ isOpen: true, title: "เกิดข้อผิดพลาด", message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", type: 'error' });
    }
  };

  if (!profile) return null; // รอจนกว่า profile จะพร้อม

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <Modal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onClose={handleCloseModal}
      />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-xl p-6 w-full max-w-md space-y-4"
        >
          <h1 className="text-center text-green-800 font-bold text-lg">
            เกือบเสร็จแล้ว!
          </h1>
          <p className="text-center text-gray-600">
            ยืนยันการเข้าสู่ระบบด้วย Google
          </p>

          <div className="text-center space-y-2">
            <img 
              src={profile.picture} 
              alt="Profile" 
              className="w-16 h-16 rounded-full mx-auto" 
            />
            <div className="font-semibold">{`${profile.firstname} ${profile.lastname}`}</div>
            <div className="text-sm text-gray-500">{profile.email}</div>
          </div>
          
          <hr className="my-4" />

          <p className="text-sm text-gray-700">
            กรุณาตั้งชื่อผู้ใช้ (Username) สำหรับใช้งานในระบบ (ตัวพิมพ์เล็ก, a-z, 0-9, _ , .)
          </p>
          <input
            type="text"
            placeholder="ตั้งชื่อผู้ใช้ (เช่น sookjaifarm)"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
            className="w-full border border-gray-300 rounded-full px-4 py-2"
          />

          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-full hover:bg-green-800 transition"
          >
            ยืนยันและเข้าสู่ระบบ
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}