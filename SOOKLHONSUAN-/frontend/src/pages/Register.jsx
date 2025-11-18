// Register.jsx (ฉบับแก้ไข)

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Modal from "../components/Modal"; // ⭐️ 1. Import Modal

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    username: "",
    password: "",
  });

  // ⭐️ 2. (ใหม่) State สำหรับ Modal และ Animation
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [isVisible, setIsVisible] = useState(false);

  // (Effect สำหรับ Animation)
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // ⭐️ 3. (ใหม่) ฟังก์ชันสำหรับปิด Modal
  const handleCloseModal = () => {
    // ถ้า Modal ที่ปิดเป็น 'success' (สมัครสำเร็จ)
    if (modal.type === 'success') {
      navigate("/login"); // 👈 ไปหน้า Login
    }
    setModal({ isOpen: false, title: '', message: '', type: 'info' });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, firstName, lastName, username, password } = form;

    if (!email || !firstName || !lastName || !username || !password) {
      // ⭐️ (แก้ไข) 4. เปลี่ยน alert เป็น Modal
      setModal({
        isOpen: true,
        title: "ข้อมูลไม่ครบ",
        message: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
        type: 'error'
      });
      return;
    }

    try {
      const payload = {
        firstname: firstName,
        lastname: lastName,
        email: email,
        username: username,
        password: password,
      };

      const response = await fetch(
        "http://localhost:4000/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // ⭐️ (แก้ไข) 5. เปลี่ยน alert เป็น Modal
        setModal({
          isOpen: true,
          title: "สมัครไม่สำเร็จ",
          message: data.error || "เกิดข้อผิดพลาดในการสมัคร",
          type: 'error'
        });
        return;
      }

      // ⭐️ (แก้ไข) 6. เปลี่ยน alert เป็น Modal
      setModal({
        isOpen: true,
        title: "สมัครสมาชิกสำเร็จ!",
        message: "คุณสามารถเข้าสู่ระบบได้เลย",
        type: 'success'
      });
      // (จะ navigate ไปหน้า login ตอนกดปิด)

    } catch (error) {
      console.error("Register error:", error);
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
          onSubmit={handleSubmit}
          className={`bg-white shadow-md rounded-xl p-6 w-full max-w-md space-y-4 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-center text-green-800 font-bold text-lg">
            สมัครสมาชิก
          </h1>

          <input
            name="email"
            type="email"
            placeholder="อีเมล"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-full px-4 py-2"
          />

          <div className="flex space-x-2">
            <input
              name="firstName"
              placeholder="ชื่อจริง"
              value={form.firstName}
              onChange={handleChange}
              className="w-1/2 border border-gray-300 rounded-full px-4 py-2"
            />
            <input
              name="lastName"
              placeholder="นามสกุล"
              value={form.lastName}
              onChange={handleChange}
              className="w-1/2 border border-gray-300 rounded-full px-4 py-2"
            />
          </div>

          <input
            name="username"
            placeholder="ชื่อผู้ใช้"
            value={form.username}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-full px-4 py-2"
          />

          <input
            name="password"
            type="password"
            placeholder="รหัสผ่าน"
            value={form.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-full px-4 py-2"
          />

          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-full hover:bg-green-800 transition"
          >
            สมัครเข้าใช้งาน
          </button>

          <p className="text-center text-sm text-gray-500 mt-2">
            มีบัญชีอยู่แล้ว?{" "}
            <Link to="/login" className="text-green-700 font-semibold">
              เข้าสู่ระบบ
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}