// Navbar.jsx (Fixed Logout Issue)

import { useState, useEffect } from "react";
import UserMenu from "./UserMenu";
import { Link, useNavigate, NavLink, useLocation } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logosook.png";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // ⭐ 1. เพิ่ม: ตัวดักจับการเปลี่ยนหน้า

  // ⭐ 2. แก้ไข: เปลี่ยน isLoggedIn เป็น State เพื่อให้ React สั่งเปลี่ยนหน้าจอได้
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  // ⭐ 3. Effect: ทุกครั้งที่ URL เปลี่ยน (เช่น กด Logout แล้วเด้งไปหน้า Login) ให้เช็ค Token ใหม่ทันที
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token); // อัปเดตสถานะจริง
  }, [location]); // ทำงานทุกครั้งที่เปลี่ยนหน้า

  const handleLogout = () => {
    // ลบ Token
    localStorage.removeItem("token"); 
    localStorage.clear(); // เผื่อมี key อื่นๆ
    
    // บังคับอัปเดต State ทันที เพื่อให้เมนูเปลี่ยนเดี๋ยวนั้นเลย
    setIsLoggedIn(false);
    setMenuOpen(false);
    
    // ดีดกลับไปหน้า Login
    navigate("/login");
  };

  const mobileMenuVariants = {
    hidden: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  const iconVariants = {
    hidden: { opacity: 0, rotate: -90, scale: 0.5 },
    visible: { opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, rotate: 90, scale: 0.5, transition: { duration: 0.2 } }
  };

  const mobileActiveStyle = "text-green-700 font-bold";
  const mobileInactiveStyle = "";

  return (
    <motion.header className="bg-white shadow-sm sticky top-0 z-50">

      {/* MOBILE HEADER */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden relative">

        {/* Hamburger button */}
        <motion.button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-green-800 absolute left-4 top-1/2 -translate-y-1/2 z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            {menuOpen ? (
              <motion.span
                key="close"
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-3xl font-bold block"
              >
                &times;
              </motion.span>
            ) : (
              <motion.svg
                key="menu"
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-8 h-8 block"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>

        <div className="flex-1 flex justify-center">
          <Link to={isLoggedIn ? "/dashboard" : "/"}>
            <img src={logo} alt="Sooklonsuan Logo" className="h-8" />
          </Link>
        </div>

        <div className="w-8" />
      </div>

      {/* DESKTOP NAVBAR */}
      <div className="hidden md:flex justify-between items-center px-8 py-3 max-w-7xl mx-auto">

        <Link to={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2">
          <img src={logo} alt="Sooklonsuan Logo" className="h-9" />
        </Link>

        <nav className="flex items-center gap-6 text-green-800 font-medium">

          {isLoggedIn ? (
            <>
              {/* Desktop Nav Links */}
              <NavLink to="/dashboard" className="relative px-3 py-1.5 rounded-lg">
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">ภาพรวม</span>
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-green-100 border-2 border-green-700 rounded-lg"
                        layoutId="active-frame"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                  </>
                )}
              </NavLink>

              <NavLink to="/history" className="relative px-3 py-1.5 rounded-lg">
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">ประวัติ</span>
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-green-100 border-2 border-green-700 rounded-lg"
                        layoutId="active-frame"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                  </>
                )}
              </NavLink>

              <NavLink to="/valuesummary" className="relative px-3 py-1.5 rounded-lg">
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">มูลค่าสวน</span>
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-green-100 border-2 border-green-700 rounded-lg"
                        layoutId="active-frame"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
              
              <NavLink to="/profilePage" className="relative px-3 py-1.5 rounded-lg">
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">โปรไฟล์</span>
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-green-100 border-2 border-green-700 rounded-lg"
                        layoutId="active-frame"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                  </>
                )}
              </NavLink>

              {/* USER MENU */}
              <div className="ml-4">
                {/* ส่ง onLogout ไปให้ด้วย เผื่อ UserMenu รองรับ */}
                <UserMenu user={{ photoURL: null }} onLogout={handleLogout} />
              </div>
            </>
          ) : (
            <>
              <motion.div as={Link} to="/login" className="text-green-700 hover:underline" whileHover={{ scale: 1.05 }}>
                Login
              </motion.div>

              <motion.div as={Link} to="/register" className="bg-green-700 text-white px-3 py-1 rounded-lg shadow hover:bg-green-800" whileHover={{ scale: 1.05 }}>
                Register
              </motion.div>
            </>
          )}

        </nav>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            className="md:hidden bg-white border-t border-gray-200 flex flex-col px-6 py-4 space-y-3"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {isLoggedIn ? (
              <>
                <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? mobileActiveStyle : mobileInactiveStyle)}>
                  ภาพรวม
                </NavLink>
                <NavLink to="/history" onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? mobileActiveStyle : mobileInactiveStyle)}>
                  ประวัติ
                </NavLink>
                <NavLink to="/valuesummary" onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? mobileActiveStyle : mobileInactiveStyle)}>
                  มูลค่าสวน
                </NavLink>
                
                <NavLink to="/profilePage" onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? mobileActiveStyle : mobileInactiveStyle)}>
                  โปรไฟล์
                </NavLink>

                <motion.button
                  onClick={handleLogout}
                  className="w-full text-center bg-red-600 text-white py-2 rounded-lg font-semibold shadow hover:bg-red-700 cursor-pointer"
                  whileTap={{ scale: 0.98 }}
                >
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <Link to="/" onClick={() => setMenuOpen(false)}>หน้าแรก</Link>

                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <motion.div as={Link} to="/login" onClick={() => setMenuOpen(false)} className="block bg-green-700 text-white text-center py-2 rounded-lg shadow hover:bg-green-800">
                    Login
                  </motion.div>

                  <motion.div as={Link} to="/register" onClick={() => setMenuOpen(false)} className="block border border-green-700 text-green-700 text-center py-2 rounded-lg hover:bg-green-50">
                    Register
                  </motion.div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.header>
  );
}