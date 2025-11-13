import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "/logosook.png";

export default function Header() {
  const [currentUser, setCurrentUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();

  // ✅ ตรวจสถานะ login ทุกครั้งที่โหลดหน้าใหม่
  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const name = localStorage.getItem("currentUserFullname");
    setCurrentUser(user);
    setFullName(name);
  }, []);

  // ✅ ฟังก์ชัน logout
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUserFullname");
    navigate("/login");
    window.location.reload(); // รีเฟรชให้ Header เปลี่ยนทันที
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

          {/* ✅ ตรวจ login */}
          {currentUser ? (
            <>
              <span className="text-gray-600">
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
