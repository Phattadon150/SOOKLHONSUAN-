// Navbar.jsx (ฉบับอัปเดต)

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logosook.png";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // 1. (แก้ไข) เช็ค "token" เพื่อดูสถานะ Login
  const isLoggedIn = !!localStorage.getItem("token");

  // 2. (แก้ไข) สร้างฟังก์ชัน Logout ที่สมบูรณ์
  const handleLogout = () => {
    localStorage.clear();
    setMenuOpen(false); // ปิดเมนู (สำหรับมือถือ)
    navigate("/login"); // ใช้ navigate เพื่อเปลี่ยนหน้า
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* ✅ Mobile Header */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-green-800 absolute left-4 top-1/2 -translate-y-1/2"
        >
          {menuOpen ? (
            <span className="text-3xl font-bold">&times;</span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>

        {/* โลโก้ตรงกลาง (ลิงก์ไป Dashboard ถ้า Login แล้ว) */}
        <div className="flex-1 flex justify-center">
          <Link to={isLoggedIn ? "/dashboard" : "/"}>
            <img src={logo} alt="Sooklonsuan Logo" className="h-8" />
          </Link>
        </div>
        <div className="w-8" />
      </div>

      {/* ✅ Desktop Navbar */}
      <div className="hidden md:flex justify-between items-center px-8 py-3 max-w-7xl mx-auto">
        <Link to={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2">
          <img src={logo} alt="Sooklonsuan Logo" className="h-9" />
        </Link>
        <nav className="flex items-center gap-6 text-green-800 font-medium">
          
          {isLoggedIn ? (
            <>
              {/* --- เมนูตอน Login --- */}
              <Link to="/dashboard">ภาพรวม</Link>
              <Link to="/history">ประวัติ</Link>
              <Link to="/valuesummary">มูลค่าสวน</Link>
              
              {/* ⭐️ (เพิ่ม) 3. เพิ่มลิงก์ "โปรไฟล์" */}
              <Link to="/profile" className="text-green-800 hover:underline">
                โปรไฟล์
              </Link>
              
              <button
                onClick={handleLogout} // 👈 ใช้ฟังก์ชัน handleLogout
                className="text-green-700 border px-3 py-1 rounded-lg hover:bg-green-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {/* --- เมนูตอนยังไม่ Login --- */}
              <Link to="/login" className="text-green-700 hover:underline">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-green-700 text-white px-3 py-1 rounded-lg shadow hover:bg-green-800 transition"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* ✅ Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 flex flex-col px-6 py-4 space-y-3">
          
          {isLoggedIn ? (
            <>
              {/* --- เมนูมือถือ ตอน Login --- */}
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>ภาพรวม</Link>
              <Link to="/history" onClick={() => setMenuOpen(false)}>ประวัติ</Link>
              <Link to="/valuesummary" onClick={() => setMenuOpen(false)}>มูลค่าสวน</Link>
              
              {/* ⭐️ (เพิ่ม) 4. เพิ่มลิงก์ "โปรไฟล์" (มือถือ) */}
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                โปรไฟล์
              </Link>
              
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <button
                  onClick={handleLogout} // 👈 ใช้ฟังก์ชัน handleLogout
                  className="text-left text-red-600 font-semibold"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              {/* --- เมนูมือถือ ตอนยังไม่ Login --- */}
              <Link to="/" onClick={() => setMenuOpen(false)}>หน้าแรก</Link>
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block bg-green-700 text-white text-center py-2 rounded-lg shadow hover:bg-green-800"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block border border-green-700 text-green-700 text-center py-2 rounded-lg hover:bg-green-50"
                >
                  Register
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}