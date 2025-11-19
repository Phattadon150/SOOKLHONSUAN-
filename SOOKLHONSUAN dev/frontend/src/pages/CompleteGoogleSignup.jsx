import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { BASE_URL } from "../api";

export default function CompleteGoogleSignup() {
  const location = useLocation();
  const navigate = useNavigate();

  const { tempToken, profile } = location.state || {};

  const [username, setUsername] = useState("");
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      return setModal({ isOpen: true, title: "ผิดพลาด", message: "กรุณากรอกชื่อผู้ใช้", type: "error" });
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/google/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, username })
      });

      const data = await res.json();
      if (!res.ok) {
        return setModal({
          isOpen: true,
          title: "สมัครไม่สำเร็จ",
          message: data.error || "ไม่สามารถสมัครสมาชิกได้",
          type: "error"
        });
      }

      // login สำเร็จ
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/");

    } catch (error) {
      console.error("Complete Google signup error:", error);
      setModal({
        isOpen: true,
        title: "ผิดพลาด",
        message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
        type: "error"
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ isOpen: false, title: "", message: "", type: "info" })}
      />

      <main className="flex-1 flex flex-col items-center px-4 py-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-xl p-6 w-full max-w-md space-y-4"
        >
          <h2 className="text-lg font-bold text-green-700 text-center">สร้างชื่อผู้ใช้</h2>

          <p className="text-center text-gray-600">
            {profile?.email}
          </p>

          <input
            type="text"
            placeholder="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-full px-4 py-2"
          />

          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-full hover:bg-green-800"
          >
            ดำเนินการต่อ
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
