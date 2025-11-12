import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "/logosook.png";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = !!localStorage.getItem("username");

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* ✅ MOBILE HEADER */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden relative">
        {/* Hamburger ซ้ายสุด */}
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

        {/* ✅ โลโก้ตรงกลาง */}
        <div className="flex-1 flex justify-center">
          <Link to="/">
            <img src={logo} alt="Sooklonsuan Logo" className="h-8" />
          </Link>
        </div>

        {/* dummy element ขวา เพื่อให้โลโก้ balance */}
        <div className="w-8" />
      </div>

      {/* ✅ DESKTOP HEADER */}
      <div className="hidden md:flex justify-between items-center px-8 py-3 max-w-7xl mx-auto">
        {/* โลโก้ซ้าย */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Sooklonsuan Logo" className="h-9" />
        </Link>

        {/* เมนูขวา */}
        <nav className="flex items-center gap-6 text-green-800 font-medium">
          <Link to="/dashboard">ภาพรวม</Link>
          <Link to="/summary">สรุปผล</Link>
          <Link to="/history">ประวัติ</Link>
          <Link to="/valuesummary">มูลค่าสวน</Link>
          <Link to="/calculate">คำนวณผลผลิต</Link>

          {isLoggedIn ? (
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="text-green-700 border px-3 py-1 rounded-lg hover:bg-green-100"
            >
              Logout
            </button>
          ) : (
            <>
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

      {/* ✅ MOBILE MENU DROPDOWN */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 flex flex-col px-6 py-4 space-y-3">
          <Link to="/" onClick={() => setMenuOpen(false)}>ภาพรวม</Link>
          <Link to="/summary" onClick={() => setMenuOpen(false)}>สรุปผล</Link>
          <Link to="/history" onClick={() => setMenuOpen(false)}>ประวัติ</Link>
          <Link to="/valuesummary" onClick={() => setMenuOpen(false)}>มูลค่าสวน</Link>
          <Link to="/calculate" onClick={() => setMenuOpen(false)}>คำนวณผลผลิต</Link>

          <div className="border-t border-gray-200 pt-3 space-y-2">
            {isLoggedIn ? (
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/login";
                }}
                className="text-left text-red-600 font-semibold"
              >
                Logout
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
