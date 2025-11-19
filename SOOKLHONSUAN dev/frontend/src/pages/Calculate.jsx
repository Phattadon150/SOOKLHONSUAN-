import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import { BASE_URL } from "../api";

export default function Calculate() {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState("");
  const [inputYield, setInputYield] = useState("");
  const [result, setResult] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/api/farms`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (res.ok) setFarms(data.farms || []);
      } catch (error) {
        console.error("Fetch farms error:", error);
      }
    };

    fetchFarms();
  }, []);

  const handleCalculate = async (e) => {
    e.preventDefault();

    if (!selectedFarm) {
      return setModal({ isOpen: true, title: "ผิดพลาด", message: "กรุณาเลือกสวน", type: "error" });
    }

    if (!inputYield) {
      return setModal({ isOpen: true, title: "ผิดพลาด", message: "กรุณาใส่ผลผลิต", type: "error" });
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${BASE_URL}/api/calculations/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ farmId: selectedFarm, yieldAmount: inputYield })
      });

      const data = await res.json();

      if (!res.ok) {
        return setModal({
          isOpen: true,
          title: "คำนวณไม่สำเร็จ",
          message: data.error || "เกิดข้อผิดพลาดในการคำนวณ",
          type: "error"
        });
      }

      setResult(data);

    } catch (error) {
      console.error("Calculate error:", error);
      setModal({ isOpen: true, title: "ผิดพลาด", message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", type: "error" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ isOpen: false, title: "", message: "", type: "info" })}
      />

      <main className="flex-1 flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md space-y-4">

          <h2 className="text-xl font-bold text-green-800 text-center">คำนวณผลผลิต</h2>

          <select
            value={selectedFarm}
            onChange={(e) => setSelectedFarm(e.target.value)}
            className="w-full border rounded-full px-4 py-2"
          >
            <option value="">เลือกสวน</option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.1"
            placeholder="ผลผลิต (กก.)"
            value={inputYield}
            onChange={(e) => setInputYield(e.target.value)}
            className="w-full border rounded-full px-4 py-2"
          />

          <button
            onClick={handleCalculate}
            className="w-full bg-green-700 text-white py-2 rounded-full hover:bg-green-800"
          >
            คำนวณ
          </button>

          {result && (
            <div className="mt-4 bg-gray-100 p-4 rounded-xl">
              <h3 className="font-bold text-green-700 mb-2">ผลลัพธ์</h3>
              <p>น้ำหนักรวม: {result.totalWeight} กก.</p>
              <p>ราคาตลาด: {result.marketPrice} บาท/กก.</p>
              <p>รายได้รวม: {result.totalIncome} บาท</p>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
