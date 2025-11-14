// Login.jsx (ฉบับแก้ไข)

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Modal from "../components/Modal"; // ⭐️ 1. Import Modal

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // ⭐️ 2. (ใหม่) State สำหรับ Modal และ Animation
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [isVisible, setIsVisible] = useState(false);

  // (Effect สำหรับ Animation)
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // ⭐️ 3. (ใหม่) ฟังก์ชันสำหรับปิด Modal
  const handleCloseModal = () => {
    // ถ้า Modal ที่ปิดเป็น 'success' (Login สำเร็จ)
    if (modal.type === 'success') {
      navigate("/"); // 👈 (แก้ไข) 4. ไปที่หน้า Landing
    }
    setModal({ isOpen: false, title: '', message: '', type: 'info' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // ⭐️ (แก้ไข) 5. เปลี่ยน alert เป็น Modal
        setModal({ 
          isOpen: true, 
          title: "เข้าสู่ระบบผิดพลาด", 
          message: data.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
          type: 'error'
        });
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("username", data.user.username);

      // ⭐️ (แก้ไข) 6. แสดง Modal ต้อนรับ (แทน alert)
      setModal({
        isOpen: true,
        title: "เข้าสู่ระบบสำเร็จ!",
        message: `ยินดีต้อนรับ ${data.user.firstname} ${data.user.lastname}`,
        type: 'success' // 👈 (สำคัญ)
      });
      // (เราจะ navigate ในฟังก์ชัน handleCloseModal)
      
    } catch (error) {
      console.error("Login error:", error);
      // ⭐️ (แก้ไข) 7. เปลี่ยน alert เป็น Modal
      setModal({
        isOpen: true,
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้: " + error.message,
        type: 'error'
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      {/* ⭐️ 8. (ใหม่) แสดง Modal */}
      <Modal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onClose={handleCloseModal}
      />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        {/* ⭐️ 9. (แก้ไข) เพิ่ม Animation ให้ฟอร์ม */}
        <form
          onSubmit={handleLogin}
          className={`bg-white shadow-md rounded-xl p-6 w-full max-w-md space-y-4 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-center text-green-800 font-bold text-lg">
            เข้าสู่ระบบ
          </h1>

          <input
            type="text"
            placeholder="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2"
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2"
          />

          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-full hover:bg-green-800 transition"
          >
            เข้าสู่ระบบ
          </button>

          <div className="flex justify-between text-sm text-gray-600 mt-3">
            <Link to="/register" className="text-green-700 hover:underline">
              สมัครเข้าใช้งาน
            </Link>
            <Link to="/forgot-password" className="text-green-700 hover:underline">
              ลืมรหัสผ่าน?
            </Link>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}