import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Calculate() {
  const navigate = useNavigate();
  const [farmName, setFarmName] = useState("");
  const [crop, setCrop] = useState("");
  const [area, setArea] = useState("");
  const [unit, setUnit] = useState("ไร่");
  const [quality, setQuality] = useState("");
  const [month, setMonth] = useState("");

  useEffect(() => {
    const farmData = JSON.parse(localStorage.getItem("farmData"));
    if (farmData) {
      setFarmName(farmData.farmName);
      setCrop(farmData.crop);
    }
  }, []);

  const user = localStorage.getItem("currentUser");
const resultData = { user, farmName, crop, area, unit, quality, month };
localStorage.setItem(`calculatedResult_${user}`, JSON.stringify(resultData));

  const handleSave = () => {
    const resultData = { farmName, crop, area, unit, quality, month };
    localStorage.setItem("calculatedResult", JSON.stringify(resultData));
    console.log("✅ saved calculatedResult:", resultData);
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="bg-white shadow-md rounded-xl p-6 w-full max-w-lg md:max-w-xl">
          <h1 className="text-green-800 font-bold text-xl mb-4 text-left">
            คำนวณผลผลิต
          </h1>

          <label className="block text-gray-700 mb-1">ชื่อพืชที่ปลูก</label>
          <input
            type="text"
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 mb-3"
          />

          <label className="block text-gray-700 mb-1">พื้นที่ (ไร่)</label>
          <input
            type="number"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 mb-3"
          />

          <label className="block text-gray-700 mb-1">คุณภาพผลผลิต</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 mb-3 bg-white"
          >
            <option value="">เลือกคุณภาพ</option>
            <option value="ดี">ดี</option>
            <option value="ปานกลาง">ปานกลาง</option>
            <option value="พอใช้">พอใช้</option>
          </select>

          <label className="block text-gray-700 mb-1">เดือนเก็บเกี่ยว</label>
          <input
            type="text"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 mb-4"
          />

          <button
            onClick={handleSave}
            className="bg-green-700 text-white px-8 py-2 rounded-full shadow hover:bg-green-800 transition w-full"
          >
            บันทึกผลผลิต
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
