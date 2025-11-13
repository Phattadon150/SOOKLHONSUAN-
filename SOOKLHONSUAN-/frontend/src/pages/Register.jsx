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

  const handleSubmit = (e) => {
    e.preventDefault();
    const { email, firstName, lastName, username, password } = form;

    if (!email || !firstName || !lastName || !username || !password) {
      alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.find((u) => u.username === username)) {
      alert("ชื่อผู้ใช้นี้ถูกใช้แล้ว");
      return;
    }

    const newUser = { email, firstName, lastName, username, password };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    alert("สมัครสมาชิกสำเร็จ!");
    navigate("/login");
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
              name="firstName"
              placeholder="ชื่อจริง"
              value={form.firstName}
              onChange={handleChange}
              className="w-1/2 border border-gray-300 rounded-full px-4 py-2"
            />
            <input
              name="lastName"
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
