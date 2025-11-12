import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    // จำลองบันทึกลง localStorage
    localStorage.setItem("username", username);
    alert("สมัครสมาชิกสำเร็จ!");
    navigate("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-xl p-6 w-full max-w-sm space-y-4"
        >
          <h1 className="text-center text-green-800 font-bold text-lg">
            สมัครใช้งาน
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
          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-full shadow hover:bg-green-800"
          >
            ลงทะเบียน
          </button>
          <p className="text-center text-sm text-gray-600">
            มีบัญชีแล้วใช่ไหม?{" "}
            <Link to="/login" className="text-green-700 hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}
