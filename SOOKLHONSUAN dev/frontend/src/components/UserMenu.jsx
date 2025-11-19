import { useState } from "react";
import { FaUserCircle } from "react-icons/fa";

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen(!open);

  return (
    <div className="relative">
      {/* รูปโปรไฟล์ */}
      <button onClick={toggle} className="flex items-center">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt="profile"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <FaUserCircle className="text-3xl text-gray-600" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-md border">
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => alert("LOGOUT")}
          >
            Log out 
          </button>
        </div>
      )}
    </div>
  );
}
