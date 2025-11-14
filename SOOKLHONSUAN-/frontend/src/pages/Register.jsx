import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // --- 🌟 นี่คือฟังก์ชันที่อัปเกรดแล้ว 🌟 ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, firstName, lastName, username, password } = form;

    if (!email || !firstName || !lastName || !username || !password) {
      alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    // Backend จะตรวจสอบการซ้ำซ้อนให้เอง
    // const users = JSON.parse(localStorage.getItem("users")) || [];
    // if (users.find((u) => u.username === username)) {
    //   alert("ชื่อผู้ใช้นี้ถูกใช้แล้ว");
    //   return;
    // }

    try {
      // สร้าง Payload ที่ตรงกับที่ Backend ต้องการ
      const payload = {
        firstname: firstName, // สังเกต: แปลง firstName -> firstname
        lastname: lastName,   // สังเกต: แปลง lastName -> lastname
        email: email,
        username: username,
        password: password,
      };

      // สมมติว่า Backend รันอยู่ที่ http://localhost:4000
      const response = await fetch(
        "http://localhost:4000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // ถ้า Backend ส่ง Error กลับมา (เช่น { error: "Email already exists" })
        alert(data.error || "สมัครสมาชิกไม่สำเร็จ");
        return;
      }

      // ถ้าสำเร็จ (Backend ตอบ 201 Created)
      alert("สมัครสมาชิกสำเร็จ!");
      navigate("/login"); // ไปหน้า Login หลังสมัครเสร็จ

    } catch (error) {
      console.error("Register error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + error.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-xl p-6 w-full max-w-md space-y-4"
        >
          <h1 className="text-center text-green-800 font-bold text-lg">
            สมัครสมาชิก
          </h1>

          <input
            name="email"
            type="email"
            placeholder="อีเมล"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-full px-4 py-2"
          />

          <div className="flex space-x-2">
            <input
              name="firstName" // React state ใช้ 'firstName'
              placeholder="ชื่อจริง"
              value={form.firstName}
              onChange={handleChange}
              className="w-1/2 border border-gray-300 rounded-full px-4 py-2"
            />
            <input
              name="lastName" // React state ใช้ 'lastName'
              placeholder="นามสกุล"
              value={form.lastName}
              onChange={handleChange}
              className="w-1/2 border border-gray-300 rounded-full px-4 py-2"
            />
          </div>

          <input
            name="username"
            placeholder="ชื่อผู้ใช้"
            value={form.username}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-full px-4 py-2"
          />

          <input
            name="password"
            type="password"
            placeholder="รหัสผ่าน"
            value={form.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-full px-4 py-2"
          />

          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-full hover:bg-green-800 transition"
          >
            สมัครเข้าใช้งาน
          </button>

          <p className="text-center text-sm text-gray-500 mt-2">
            มีบัญชีอยู่แล้ว?{" "}
            <Link to="/login" className="text-green-700 font-semibold">
              เข้าสู่ระบบ
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}