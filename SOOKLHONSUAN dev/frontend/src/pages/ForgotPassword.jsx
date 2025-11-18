import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find((u) => u.email === email);

    if (user) {
      alert(`อีเมล ${email} พบในระบบ\n(ในระบบจริงจะส่งลิงก์รีเซ็ตรหัสผ่าน)`);
      navigate("/login");
    } else {
      alert("ไม่พบอีเมลนี้ในระบบ");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-xl p-6 w-full max-w-md space-y-4"
        >
          <h1 className="text-center text-green-800 font-bold text-lg">
            ลืมรหัสผ่าน
          </h1>

          <input
            type="email"
            placeholder="กรอกอีเมลที่ใช้สมัคร"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2"
          />

          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-full hover:bg-green-800 transition"
          >
            ยืนยัน
          </button>

          <p className="text-center text-sm text-gray-500">
            <Link to="/login" className="text-green-700 hover:underline">
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}
