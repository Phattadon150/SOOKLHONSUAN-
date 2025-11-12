import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function FarmForm() {
  const [farmName, setFarmName] = useState("");
  const [crop1, setCrop1] = useState("");
  const [crop2, setCrop2] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!farmName) {
      alert("กรุณากรอกชื่อสวน");
      return;
    }

    // บันทึกข้อมูลสวนใน localStorage (หรือ backend)
    const farmData = { farmName, crop1, crop2 };
    localStorage.setItem("farmData", JSON.stringify(farmData));

    // ส่งไปหน้า Dashboard
    navigate("/");
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
            กรอกชื่อสวน
          </h1>

          <input
            type="text"
            placeholder="ชื่อสวน"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
          />

          <h2 className="text-center font-semibold text-gray-600 mt-4">
            เพิ่มข้อมูล
          </h2>

          <input
            type="text"
            placeholder="ใส่ชื่อพืช"
            value={crop1}
            onChange={(e) => setCrop1(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2"
          />
          <input
            type="text"
            placeholder="ใส่ชื่อพืช"
            value={crop2}
            onChange={(e) => setCrop2(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2"
          />

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
