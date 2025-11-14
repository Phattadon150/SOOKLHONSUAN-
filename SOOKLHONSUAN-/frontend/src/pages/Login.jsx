import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // --- 🌟 นี่คือฟังก์ชันที่อัปเกรดแล้ว 🌟 ---
  const handleLogin = async (e) => {
    e.preventDefault();

    // const users = JSON.parse(localStorage.getItem("users")) || [];
    // const user = users.find(
    //   (u) => u.username === username && u.password === password
    // );

    try {
      // สมมติว่า Backend รันอยู่ที่ http://localhost:4000
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // ถ้า Backend ส่ง Error กลับมา (เช่น { error: "Invalid email or password" })
        alert(data.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      // ถ้า Login สำเร็จ (Backend ส่ง token และ user object กลับมา)
      // if (user) {
      //   localStorage.setItem("currentUser", username);
      //   localStorage.setItem("currentUserFullname", `${user.firstName} ${user.lastName}`);
      
      // 💡 เก็บ token และ user object ที่ได้จาก Backend
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user)); // เก็บ object user ทั้งก้อน

      // สังเกต: เราใช้ data.user.firstname (ตัวเล็ก) ที่ได้จาก Backend
      alert(`ยินดีต้อนรับ ${data.user.firstname} ${data.user.lastname}`);
      navigate("/farmform");
      
    } catch (error) {
      console.error("Login error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + error.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="bg-white shadow-md rounded-xl p-6 w-full max-w-md space-y-4"
        >
          <h1 className="text-center text-green-800 font-bold text-lg">
            เข้าสู่ระบบ
          </h1>

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

          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-full hover:bg-green-800 transition"
          >
            เข้าสู่ระบบ
          </button>

          <div className="flex justify-between text-sm text-gray-600 mt-3">
            <Link to="/register" className="text-green-700 hover:underline">
              สมัครเข้าใช้งาน
            </Link>
            <Link to="/forgot-password" className="text-green-700 hover:underline">
              ลืมรหัสผ่าน?
            </Link>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}