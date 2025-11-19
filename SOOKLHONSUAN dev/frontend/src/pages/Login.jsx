// frontend/src/Login.jsx

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleCloseModal = () => {
    if (modal.type === 'success') {
      navigate("/"); 
    }
    setModal({ isOpen: false, title: '', message: '', type: 'info' });
  };

  const handleLoginSuccess = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("username", user.username);
    
    setModal({
      isOpen: true,
      title: "เข้าสู่ระบบสำเร็จ!",
      message: `ยินดีต้อนรับ ${user.firstname} ${user.lastname}`,
      type: 'success'
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setModal({ 
          isOpen: true, 
          title: "เข้าสู่ระบบผิดพลาด", 
          message: data.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
          type: 'error'
        });
        return;
      }
      handleLoginSuccess(data.token, data.user);
    } catch (error) {
      console.error("Login error:", error);
      setModal({
        isOpen: true,
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        type: 'error'
      });
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    const idToken = credentialResponse.credential;
    try {
      const response = await fetch("http://localhost:4000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setModal({ isOpen: true, title: "Google Login ผิดพลาด", message: data.error || "Verify Token Failed", type: 'error' });
        return;
      }

      if (data.status === 'NEED_USERNAME') {
        navigate('/complete-google-signup', { 
          state: { tempToken: data.temp_token, profile: data.google_profile } 
        });
      } else {
        handleLoginSuccess(data.token, data.user);
      }

    } catch (error) {
      console.error("Google Login error:", error);
      setModal({ isOpen: true, title: "เกิดข้อผิดพลาด", message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", type: 'error' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <Modal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onClose={handleCloseModal}
      />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className={`bg-white shadow-md rounded-xl p-6 w-full max-w-md space-y-4 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-center text-green-800 font-bold text-lg">เข้าสู่ระบบ</h1>

          <input
            type="text"
            placeholder="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2"
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2"
          />

          <button type="submit" className="w-full bg-green-700 text-white py-2 rounded-full hover:bg-green-800 transition">
            เข้าสู่ระบบ
          </button>

          <div className="flex justify-between text-sm text-gray-600 mt-3">
            <Link to="/register" className="text-green-700 hover:underline">สมัครเข้าใช้งาน</Link>
            <Link to="/forgot-password" className="text-green-700 hover:underline">ลืมรหัสผ่าน?</Link>
          </div>

          <div className="flex items-center my-4">
            <hr className="flex-grow border-t border-gray-300" />
            <span className="mx-4 text-gray-500 text-sm">หรือ</span>
            <hr className="flex-grow border-t border-gray-300" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => console.log('Google Login Failed')}
              useOneTap={false} 
              shape="pill"
            />
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}