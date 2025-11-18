import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (username && password) {
      // จำลอง login (จริงๆ จะมาจาก backend)
      localStorage.setItem("username", username);
      navigate("/farmform"); // ไปหน้ากรอกชื่อสวน
    } else {
      alert("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="bg-white shadow-md rounded-xl p-6 w-full max-w-sm space-y-4"
        >
          <h1 className="text-center text-green-800 font-bold text-lg">
            เข้าสู่ระบบ
          </h1>
          <input
            type="text"
            placeholder="ชื่อบัญชีผู้ใช้"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <div className="text-right text-sm text-red-600">
            <Link to="/register">สมัครใช้งาน</Link>
          </div>
          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-full shadow hover:bg-green-800"
          >
            ลงชื่อเข้าใช้
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
