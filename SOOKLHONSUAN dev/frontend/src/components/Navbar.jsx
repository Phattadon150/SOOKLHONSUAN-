// Navbar.jsx (อัปเดต: Sliding Frame + Red Logout Button)

import { useState } from "react";
import { Link, useNavigate, NavLink } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logosook.png";


export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.clear();
    setMenuOpen(false); 
    navigate("/login"); 
  };

  // (Variants สำหรับเมนูมือถือ - ยังคงไว้)
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

  // (Variants สำหรับไอคอน - ยังคงไว้)
  const iconVariants = {
    hidden: { opacity: 0, rotate: -90, scale: 0.5 },
    visible: { opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, rotate: 90, scale: 0.5, transition: { duration: 0.2 } }
  };
  
  // (Style สำหรับ Active Link บนมือถือ - ยังคงไว้)
  const mobileActiveStyle = "text-green-700 font-bold";
  const mobileInactiveStyle = "";

  return (
    <motion.header 
      className="bg-white shadow-sm sticky top-0 z-50"
    >
      {/* ✅ Mobile Header (คงไว้) */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden relative">
        <motion.button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-green-800 absolute left-4 top-1/2 -translate-y-1/2"
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
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

      {/* ✅ Desktop Navbar */}
      <div className="hidden md:flex justify-between items-center px-8 py-3 max-w-7xl mx-auto">
        <Link to={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2">
          <img src={logo} alt="Sooklonsuan Logo" className="h-9" />
        </Link>
        <nav className="flex items-center gap-6 text-green-800 font-medium">
          
          {isLoggedIn ? (
            <>
              {/* --- ⭐️ 1. (แก้ไข) โครงสร้าง NavLink ใหม่ทั้งหมด --- */}
              <NavLink 
                to="/dashboard" 
                className="relative px-3 py-1.5 rounded-lg" // 👈 (A) Container
              >
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">ภาพรวม</span> {/* 👈 (B) Text */}
                    {isActive && (
                      <motion.div 
                        className="absolute inset-0 bg-green-100 border-2 border-green-700 rounded-lg" // 👈 (C) กรอบ
                        layoutId="active-frame" // 👈 (D) ID สำหรับเลื่อน
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
              
              <NavLink 
                to="/history" 
                className="relative px-3 py-1.5 rounded-lg"
              >
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

              <NavLink 
                to="/valuesummary" 
                className="relative px-3 py-1.5 rounded-lg"
              >
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

              <NavLink 
                to="/profilePage" 
                className="relative px-3 py-1.5 rounded-lg"
              >
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

              {/* --- ⭐️ 2. (แก้ไข) ปุ่ม Logout สีแดง (Desktop) --- */}
              <motion.button
                onClick={handleLogout} 
                className="bg-red-600 text-white px-4 py-1.5 rounded-lg shadow-md hover:bg-red-700 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </>
          ) : (
            <>
              {/* (ส่วนยังไม่ Login - เหมือนเดิม) */}
              <motion.div
                as={Link}
                to="/login"
                className="text-green-700 hover:underline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </motion.div>
              <motion.div
                as={Link}
                to="/register"
                className="bg-green-700 text-white px-3 py-1 rounded-lg shadow hover:bg-green-800 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Register
              </motion.div>
            </>
          )}
        </nav>
      </div>

      {/* ✅ Mobile Menu Dropdown (คง Animation ไว้) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            key="mobile-menu"
            className="md:hidden bg-white border-t border-gray-200 flex flex-col px-6 py-4 space-y-3"
            variants={mobileMenuVariants} 
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{ overflow: 'hidden' }} 
          >
            
            {isLoggedIn ? (
              <>
                {/* (NavLink มือถือ - ใช้แบบเดิมคือตัวหนา) */}
                <NavLink 
                  to="/dashboard" 
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? mobileActiveStyle : mobileInactiveStyle)}
                >
                  ภาพรวม
                </NavLink>
                <NavLink 
                  to="/history" 
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? mobileActiveStyle : mobileInactiveStyle)}
                >
                  ประวัติ
                </NavLink>
                <NavLink 
                  to="/valuesummary" 
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? mobileActiveStyle : mobileInactiveStyle)}
                >
                  มูลค่าสวน
                </NavLink>
                <NavLink 
                  to="/profilePage" 
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? mobileActiveStyle : mobileInactiveStyle)}
                >
                  โปรไฟล์
                </NavLink>
                
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  {/* --- ⭐️ 3. (แก้ไข) ปุ่ม Logout สีแดง (Mobile) --- */}
                  <motion.button
                    onClick={handleLogout} 
                    className="w-full text-center bg-red-600 text-white py-2 rounded-lg font-semibold shadow hover:bg-red-700"
                    whileTap={{ scale: 0.98 }}
                  >
                    Logout
                  </motion.button>
                </div>
              </>
            ) : (
              <>
                {/* (ส่วนยังไม่ Login - มือถือ - เหมือนเดิม) */}
                <Link to="/" onClick={() => setMenuOpen(false)}>หน้าแรก</Link>
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <motion.div
                    as={Link}
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block bg-green-700 text-white text-center py-2 rounded-lg shadow hover:bg-green-800"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Login
                  </motion.div>
                  <motion.div
                    as={Link}
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block border border-green-700 text-green-700 text-center py-2 rounded-lg hover:bg-green-50"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
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