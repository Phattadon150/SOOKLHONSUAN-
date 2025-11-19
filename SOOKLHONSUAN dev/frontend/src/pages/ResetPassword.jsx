import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar"; 
import Footer from "../components/Footer";
import Modal from "../components/Modal"; // ใช้ Modal ตัวเดิม

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // ดึง Token จาก URL (?token=...)
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State สำหรับ Modal
  const [modal, setModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info' 
  });

  // ถ้าไม่มี Token ให้เด้งไปหน้า Login หรือแจ้งเตือน
  useEffect(() => {
    if (!token) {
      setModal({
        isOpen: true,
        title: "ไม่พบ Token",
        message: "ลิงก์นี้ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่อีกครั้ง",
        type: "error"
      });
    }
  }, [token]);

  const handleCloseModal = () => {
    setModal({ ...modal, isOpen: false });
    // ถ้าเปลี่ยนรหัสสำเร็จ ให้เด้งไปหน้า Login เมื่อปิด Modal
    if (modal.title === "เปลี่ยนรหัสผ่านสำเร็จ") {
      navigate("/login");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (password !== confirmPassword) {
      setModal({ isOpen: true, title: "ข้อผิดพลาด", message: "รหัสผ่านทั้งสองช่องไม่ตรงกัน", type: 'error' });
      return;
    }
    if (password.length < 8) {
      setModal({ isOpen: true, title: "ความปลอดภัยต่ำ", message: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร", type: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      // ยิง API ไปที่ Backend
      const response = await fetch("http://localhost:4000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setModal({
          isOpen: true,
          title: "เปลี่ยนรหัสผ่านสำเร็จ",
          message: "คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที",
          type: 'success'
        });
        // (การ navigate จะเกิดขึ้นใน handleCloseModal)
      } else {
        throw new Error(data.error || "ลิงก์หมดอายุหรือใช้งานไม่ได้");
      }

    } catch (error) {
      console.error("Reset Password Error:", error);
      setModal({
        isOpen: true,
        title: "เกิดข้อผิดพลาด",
        message: error.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <Modal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onClose={handleCloseModal}
      />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md space-y-6">
          
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-green-800">
              ตั้งรหัสผ่านใหม่
            </h1>
            <p className="text-gray-500 text-sm">
              กรุณากรอกรหัสผ่านใหม่ของคุณที่ต้องการใช้งาน
            </p>
          </div>

          {/* ถ้าไม่มี Token ไม่ต้องแสดงฟอร์ม */}
          {token ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 rounded-lg text-white font-semibold shadow-md transition-all duration-200 ${
                  isLoading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-green-700 hover:bg-green-800 hover:shadow-lgCc transform hover:-translate-y-0.5"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังบันทึก...
                  </span>
                ) : (
                  "ยืนยันการเปลี่ยนรหัสผ่าน"
                )}
              </button>
            </form>
          ) : (
             <div className="text-center text-red-500 bg-red-50 p-4 rounded-lg border border-red-100">
                ไม่พบ Token ในลิงก์นี้
             </div>
          )}

          <div className="flex justify-center pt-2 border-t border-gray-100">
            <Link 
              to="/login" 
              className="text-sm font-medium text-green-700 hover:text-green-900 hover:underline flex items-center gap-1 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}