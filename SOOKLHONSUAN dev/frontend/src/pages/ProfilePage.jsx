import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header"; // 👈 แก้ไข path
import Footer from "./components/Footer"; // 👈 แก้ไข path

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // state สำหรับเก็บข้อมูล user
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. หา token จาก localStorage
    const token = localStorage.getItem("token");

    if (!token) {
      // ถ้าไม่มี token ให้เด้งไปหน้า login
      navigate("/login");
      return;
    }

    // 2. สร้างฟังก์ชันเพื่อดึงข้อมูล Profile
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          "http://localhost:4000/api/users/profile",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // 👈 ส่ง token ไปใน Header
            },
          }
        );

        if (response.status === 401) {
          // ถ้า token หมดอายุ หรือไม่ถูกต้อง
          throw new Error("Token ไม่ถูกต้อง, กรุณาเข้าสู่ระบบใหม่");
        }
        
        if (!response.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลโปรไฟล์ได้");
        }

        const data = await response.json();
        setUser(data); // 3. เก็บข้อมูล user ที่ได้จาก API ลงใน state
        
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.message);
        // ถ้ามีปัญหา (เช่น token หมดอายุ) ให้ลบข้อมูลเก่าทิ้ง
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login"); // เด้งไปหน้า login
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]); // ให้ useEffect ทำงานเมื่อ navigate (จาก react-router) พร้อมใช้งาน

  // ฟังก์ชันสำหรับ Logout
  const handleLogout = () => {
    // ลบข้อมูลออกจาก localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // เด้งไปหน้า Login
    alert("ออกจากระบบสำเร็จ");
    navigate("/login");
  };

  // --- ส่วนการแสดงผล (Render) ---

  // 1. ขณะกำลังโหลด
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">กำลังโหลดข้อมูลโปรไฟล์...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. ถ้ามี Error (ซึ่ง useEffect จะเด้งไป login อยู่แล้ว แต่กันไว้)
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>
        </main>
        <Footer />
      </div>
    );
  }

  // 3. ถ้าโหลดสำเร็จและมีข้อมูล user
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {user && ( // ตรวจสอบว่า user ไม่ใช่ null
          <div className="bg-white shadow-md rounded-xl p-6 w-full max-w-lg">
            <h1 className="text-green-800 font-bold text-xl mb-6 text-center">
              โปรไฟล์ของฉัน
            </h1>

            {/* ส่วนแสดงข้อมูล */}
            <div className="space-y-3">
              <ProfileRow label="ชื่อจริง" value={user.firstname} />
              <ProfileRow label="นามสกุล" value={user.lastname} />
              <ProfileRow label="ชื่อผู้ใช้ (Username)" value={user.username} />
              <ProfileRow label="อีเมล" value={user.email} />
              <ProfileRow label="ประเภทบัญชี" value={user.plan_type} />
              <ProfileRow 
                label="วันที่สมัคร" 
                value={new Date(user.created_at).toLocaleString('th-TH', {
                  dateStyle: 'long',
                  timeStyle: 'short'
                })} 
              />
            </div>

            {/* ปุ่ม Logout */}
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 rounded-full hover:bg-red-700 transition mt-8"
            >
              ออกจากระบบ
            </button>
            
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

// Component ย่อยสำหรับแสดงแถวข้อมูล (เพื่อความสวยงาม)
function ProfileRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-2">
      <span className="text-sm font-semibold text-gray-600">{label}</span>
      <span className="text-gray-800 text-right">{value}</span>
    </div>
  );
}