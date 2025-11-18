// 📍 Header.jsx (ฉบับแก้ไข)
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "/logosook.png";

export default function Header() {
  const [currentUser, setCurrentUser] = useState(null); // ✅ เก็บ username หรือ id
  const [fullName, setFullName] = useState("");       // ✅ เก็บชื่อเต็ม
  const navigate = useNavigate();

  // ✅ ตรวจสถานะ login ทุกครั้งที่โหลดหน้าใหม่ (จาก localStorage ที่อัปเดตแล้ว)
  useEffect(() => {
    // ✅ อ่าน 'user' (JSON string) แทน 'currentUser'
    const userString = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (token && userString) {
      try {
        // ✅ แปลง JSON string เป็น object
        const user = JSON.parse(userString);
        
        // ✅ ใช้ user.username และ user.firstname/lastname ตามที่ได้จาก Backend
        setCurrentUser(user.username); 
        setFullName(`${user.firstname} ${user.lastname}`);
      } catch (e) {
        console.error("Failed to parse user data from localStorage:", e);
        // ถ้าข้อมูลใน localStorage พัง ก็ลบทิ้งไปเลย
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []); // [] ให้ทำงานแค่ครั้งเดียวตอนโหลด

  // ✅ ฟังก์ชัน logout (อัปเดตให้ลบ key ที่ถูกต้อง)
  const handleLogout = () => {
    // ✅ เคลียร์ 'token' และ 'user' ตอน logout
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // อัปเดต state ใน React ทันที (หรือจะ reload ก็ได้)
    setCurrentUser(null);
    setFullName("");

    navigate("/login");
    // window.location.reload(); // ใช้วิธีนี้ก็ได้ถ้าอยากชัวร์ว่าเคลียร์หมด
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* โลโก้ */}
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="Logo" className="h-8 w-auto" />
        </div>

        {/* เมนูหลัก */}
        <nav className="hidden md:flex items-center space-x-6 text-green-800 font-medium">
          <Link to="/dashboard">ภาพรวม</Link>
          <Link to="/summary">สรุปผล</Link>
          <Link to="/history">ประวัติ</Link>
          <Link to="/valuesummary">มูลค่าสวน</Link>
          <Link to="/calculate">คำนวณผลผลิต</Link>

          {/* ✅ ตรวจ login จาก state (currentUser) */}
          {currentUser ? (
            <>
              <span className="text-gray-600">
                {/* ✅ ใช้ fullName ที่เราตั้งไว้ */}
                สวัสดี, {fullName || currentUser}
              </span>
              <button
                onClick={handleLogout}
                className="ml-4 bg-green-700 text-white px-4 py-1 rounded-full hover:bg-green-800 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link
                to="/register"
                className="bg-green-700 text-white px-4 py-1 rounded-full hover:bg-green-800 transition"
              >
                Register
              </Link>
            </>
          )}
        </nav>

        {/* เมนู mobile (hamburger) */}
        <div className="md:hidden">
          <button className="text-green-800">☰</button>
        </div>
      </div>
    </header>
  );
}