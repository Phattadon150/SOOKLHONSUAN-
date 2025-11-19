import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar"; 
import Footer from "../components/Footer";
import Modal from "../components/Modal"; // ใช้ Modal ตัวเดียวกับหน้า Login

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State สำหรับ Modal (โครงสร้างเดียวกับหน้า Login)
  const [modal, setModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info' 
  });

  const handleCloseModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation เบื้องต้น
    if (!email) {
      setModal({ isOpen: true, title: "ข้อมูลไม่ครบถ้วน", message: "กรุณากรอกอีเมล", type: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      // ⭐ ยิง API ไปยัง Backend (ต้องมี Endpoint นี้ใน Server)
      const response = await fetch("http://localhost:4000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        // กรณีสำเร็จ
        setModal({
          isOpen: true,
          title: "ส่งคำขอสำเร็จ",
          message: "ระบบได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบ Inbox หรือ Junk Mail",
          type: 'success'
        });
        setEmail(""); // ล้างช่องอีเมล
      } else {
        // กรณีไม่สำเร็จ (เช่น อีเมลไม่มีในระบบ)
        throw new Error(data.error || "ไม่พบอีเมลนี้ในระบบ");
      }

    } catch (error) {
      console.error("Forgot Password Error:", error);
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

      {/* Modal Component */}
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
              ลืมรหัสผ่าน?
            </h1>
            <p className="text-gray-500 text-sm">
              ไม่ต้องกังวล! เพียงกรอกอีเมลของคุณด้านล่าง <br/>
              เราจะส่งคำแนะนำในการตั้งรหัสผ่านใหม่ไปให้
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  : "bg-green-700 hover:bg-green-800 hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังส่งข้อมูล...
                </span>
              ) : (
                "ส่งลิงก์รีเซ็ตรหัสผ่าน"
              )}
            </button>
          </form>

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