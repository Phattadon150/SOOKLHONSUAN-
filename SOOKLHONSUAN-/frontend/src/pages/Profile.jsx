// Profile.jsx (ไฟล์ใหม่)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar'; // 👈 ใช้ Navbar
import Footer from '../components/Footer';

export default function Profile() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 1. ตรวจสอบ Token
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login'); // ถ้าไม่ Login ให้เด้งกลับ
      return;
    }
    
    // 2. ดึงชื่อผู้ใช้ (จากที่เคยเช็คใน Navbar เดิม)
    const storedUsername = localStorage.getItem('username') || 'ผู้ใช้'; 
    setUsername(storedUsername);
    
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 text-center">
          
          <h1 className="text-3xl font-bold text-green-900 mb-4">
            โปรไฟล์
          </h1>
          
          <p className="text-xl text-gray-700 mb-6">
            สวัสดีครับ, <strong className="text-green-800">{username}</strong>!
          </p>

          <div className="border-t pt-6 text-left space-y-4">
            <p className="text-gray-600">
              หน้านี้เป็นส่วนสำหรับจัดการข้อมูลส่วนตัวของคุณ
            </p>
            {/* (ในอนาคต สามารถเพิ่มฟอร์มเปลี่ยนรหัสผ่าน หรือการตั้งค่าอื่นๆ ที่นี่)
            */}
            <button 
              className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              disabled
            >
              เปลี่ยนรหัสผ่าน (เร็วๆ นี้)
            </button>
            <button 
              className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              disabled
            >
              จัดการการตั้งค่า (เร็วๆ นี้)
            </button>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}