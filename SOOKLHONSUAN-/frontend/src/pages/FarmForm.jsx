import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function FarmForm() {
  const navigate = useNavigate();
  const [farmName, setFarmName] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");

  const user = localStorage.getItem("currentUser");
  const cropOptions = ["ลำไย", "มะนาว", "มะกรูด", "พริก", "มะม่วง"];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!farmName || !selectedCrop) {
      alert("กรุณากรอกชื่อสวนและเลือกพืช");
      return;
    }

    const farmData = {
      user,
      farmName,
      crop: selectedCrop,
    };

    // ✅ เก็บข้อมูลสวนของผู้ใช้
    localStorage.setItem(`farmData_${user}`, JSON.stringify(farmData));
    console.log("✅ farmData saved:", farmData);

    // ✅ ไปหน้า Dashboard หลังบันทึก
    navigate("/dashboard");
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
            เลือกพืชที่ปลูก
          </h2>

          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="">-- เลือกพืช --</option>
            {cropOptions.map((crop, index) => (
              <option key={index} value={crop}>
                {crop}
              </option>
            ))}
          </select>

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
