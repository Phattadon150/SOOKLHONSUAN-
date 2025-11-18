import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Calculate() {
  const [area, setArea] = useState("");
  const [unit, setUnit] = useState("ไร่");
  const [plantType, setPlantType] = useState(""); // ดึงจาก FarmForm
  const [treeAge, setTreeAge] = useState("");
  const [quality, setQuality] = useState("");
  const [month, setMonth] = useState("");

  // ✅ ดึงข้อมูลจาก localStorage (ข้อมูลจาก FarmForm)
  useEffect(() => {
    const farmData = JSON.parse(localStorage.getItem("farmData"));
    if (farmData && farmData.crop) {
      setPlantType(farmData.crop);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!area || !plantType) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    // ตัวอย่างจำลองผลลัพธ์
    alert(`คำนวณผลผลิตของ "${plantType}" พื้นที่ ${area} ${unit} สำเร็จ!`);
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
            คำนวณผลผลิต
          </h1>

          {/* แสดงพืชที่เลือกจาก FarmForm */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">พืชที่คุณเลือก:</p>
            <p className="text-lg font-semibold text-green-800">
              {plantType || "ยังไม่ได้เลือกพืช"}
            </p>
          </div>

          {/* คำนวณตามพื้นที่ */}
          <h2 className="text-center font-semibold text-gray-700 mt-2">
            คำนวณตามพื้นที่
          </h2>
          <div className="flex gap-2 justify-center">
            <input
              type="number"
              placeholder="จำนวน"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-24 border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 text-center"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
            >
              <option value="ไร่">ไร่</option>
              <option value="งาน">งาน</option>
              <option value="ตารางวา">ตารางวา</option>
            </select>
          </div>

          {/* อายุเฉลี่ยของสวน */}
          <div>
            <h2 className="text-center font-semibold text-gray-700 mt-4 mb-2">
              อายุเฉลี่ยของสวน
            </h2>
            <input
              type="number"
              placeholder="อายุ (ปี)"
              value={treeAge}
              onChange={(e) => setTreeAge(e.target.value)}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-center focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* คุณภาพผลผลิต */}
          <div>
            <h2 className="text-center font-semibold text-gray-700 mt-4 mb-2">
              คุณภาพผลผลิต (ดี / ปานกลาง / พอใช้)
            </h2>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
            >
              <option value="">เลือกคุณภาพ</option>
              <option value="ดี">ดี</option>
              <option value="ปานกลาง">ปานกลาง</option>
              <option value="พอใช้">พอใช้</option>
            </select>
          </div>

          {/* เดือนเก็บเกี่ยว */}
          <div>
            <h2 className="text-center font-semibold text-gray-700 mt-4 mb-2">
              เดือนเก็บเกี่ยว
            </h2>
            <input
              type="text"
              placeholder="เดือน"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-center focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-full shadow hover:bg-green-800 mt-4"
          >
            คำนวณ
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
