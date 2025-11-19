import { useState } from "react";
import { FaUserCircle } from "react-icons/fa";

// ⭐ แก้จุดที่ 1: เพิ่ม onLogout ในวงเล็บ
export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen(!open);

  return (
    <div className="relative">
      {/* รูปโปรไฟล์ */}
      <button onClick={toggle} className="flex items-center focus:outline-none">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt="profile"
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <FaUserCircle className="text-3xl text-gray-600" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-md border z-50">
           {/* (Optional) เพิ่มเมนูโปรไฟล์ถ้าต้องการ */}
           {/* <Link to="/profilePage" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">โปรไฟล์</Link> */}
           
          <button
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
            onClick={() => {
                // ⭐ แก้จุดที่ 2: เรียกฟังก์ชัน Logout ของจริง
                if (onLogout) {
                    onLogout(); 
                } else {
                    console.error("หาฟังก์ชัน Logout ไม่เจอ!");
                }
            }}
          >
            Log out 
          </button>
        </div>
      )}
    </div>
  );
}