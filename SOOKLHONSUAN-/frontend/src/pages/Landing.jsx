// pages/Landing.jsx (ฉบับแก้ไข)

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import logo from '../assets/logosook.png'; // (ต้องมั่นใจว่า path นี้ถูกต้อง)

export default function Landing() {
  const navigate = useNavigate();

  // 1. ⭐️ (แก้ไข) State สำหรับ Animation, สถานะ Login, และ ชื่อผู้ใช้
  const [isVisible, setIsVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // 2. ⭐️ (แก้ไข) ตรวจสอบสถานะ Login เมื่อหน้าโหลด
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      // (ดึงชื่อผู้ใช้ที่เราเก็บไว้ตอน Login)
      setUsername(localStorage.getItem("username") || 'ผู้ใช้งาน');
    } else {
      setIsLoggedIn(false);
    }

    // หน่วงเวลาเล็กน้อยเพื่อให้ animation ทำงาน
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // 👈 Run ครั้งเดียวตอนเปิดหน้า

  return (
    // 3. ⭐️ (แก้ไข) เปลี่ยนพื้นหลังเป็น 'bg-white'
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 -mt-16">
        
        {/* 4. ⭐️ (แก้ไข) แสดงผลตามสถานะ Login */}
        {isLoggedIn ? (
          
          // ---------------------------------
          // ⭐️⭐️ (A) เมื่อ Login แล้ว ⭐️⭐️
          // ---------------------------------
          <>
            <img 
              src={logo} 
              alt="Sooklonsuan Logo" 
              className={`h-20 md:h-28 mb-6 transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              }`}
            />
            
            {/* 5. ⭐️ (ใหม่) ข้อความต้อนรับชื่อผู้ใช้ */}
            <h1 
              className={`text-4xl md:text-6xl font-extrabold text-green-900 mb-4 transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              ยินดีต้อนรับ
            </h1>
            <p 
              className={`text-2xl md:text-3xl text-green-800 mb-10 transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              }`}
              style={{ transitionDelay: '400ms' }}
            >
              คุณ <span className="font-bold">{username}</span>!
            </p>

            {/* 6. ⭐️ (ใหม่) ปุ่มสำหรับคน Login แล้ว */}
            <div 
              className={`flex flex-col sm:flex-row gap-4 transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              }`}
              style={{ transitionDelay: '600ms' }}
            >
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-green-700 text-white font-bold text-lg px-10 py-3 rounded-full shadow-lg hover:bg-green-800 transition-transform duration-200 hover:scale-105"
              >
                ไปที่ Dashboard
              </button>
              <button
                onClick={() => navigate('/history')}
                className="bg-white text-green-700 font-bold text-lg px-10 py-3 rounded-full shadow-lg border border-green-700 hover:bg-green-50 transition-transform duration-200 hover:scale-105"
              >
                ดูประวัติ
              </button>
            </div>
          </>

        ) : (
          
          // ---------------------------------
          // ⭐️⭐️ (B) เมื่อยังไม่ Login ⭐️⭐️
          // ---------------------------------
          <>
            <img 
              src={logo} 
              alt="Sooklonsuan Logo" 
              className={`h-20 md:h-28 mb-6 transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              }`}
              style={{ transitionDelay: '100ms' }}
            />
            <h1 
              className={`text-4xl md:text-6xl font-extrabold text-green-900 mb-4 transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              }`}
              style={{ transitionDelay: '300ms' }}
            >
              สุขล้นสวน
            </h1>
            <p 
              className={`text-lg md:text-2xl text-green-800 mb-2 transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              }`}
              style={{ transitionDelay: '500ms' }}
            >
              ยินดีต้อนรับ! ผู้ช่วยอัจฉริยะของเกษตรกรรุ่นใหม่
            </p>
            <p 
              className={`text-md md:text-xl text-gray-600 mb-10 transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              }`}
              style={{ transitionDelay: '700ms' }}
            >
              คำนวณ – วางแผน – ติดตามผลผลิต ได้ในที่เดียว
            </p>
            <div 
              className={`flex flex-col sm:flex-row gap-4 transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              }`}
              style={{ transitionDelay: '900ms' }}
            >
              <button
                onClick={() => navigate('/login')}
                className="bg-green-700 text-white font-bold text-lg px-10 py-3 rounded-full shadow-lg hover:bg-green-800 transition-transform duration-200 hover:scale-105"
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-white text-green-700 font-bold text-lg px-10 py-3 rounded-full shadow-lg border border-green-700 hover:bg-green-50 transition-transform duration-200 hover:scale-105"
              >
                สมัครสมาชิก
              </button>
            </div>
          </>
        )}
        
      </main>

      <Footer />
    </div>
  );
}