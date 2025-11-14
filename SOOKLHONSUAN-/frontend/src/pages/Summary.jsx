import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Helper function (เผื่อตัวเลขเป็น null)
const formatNum = (num, digits = 0) => {
  const n = Number(num);
  if (!Number.isFinite(n) || n === 0) return "-";
  return n.toLocaleString("th-TH", { 
    minimumFractionDigits: digits, 
    maximumFractionDigits: digits 
  });
};

export default function Summary() {
  const navigate = useNavigate();
  const location = useLocation(); // 👈 1. ใช้ useLocation เพื่อดึง state
  const { farmId } = useParams();

  // 2. ดึงข้อมูลที่ส่งมาจากหน้า Calculate
  // calculationData คือ { preview: true, input: {...}, result: {...} }
  const { calculationData } = location.state || {};
  
  const [isSaving, setIsSaving] = useState(false);

  // 3. ถ้าไม่มีข้อมูล (เช่น เข้าหน้านี้ตรงๆ) ให้เด้งกลับ
  if (!calculationData) {
    return (
      <div className="flex flex-col min-h-screen bg-stone-50">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center">
          <p className="text-red-500">ไม่พบข้อมูลการคำนวณ</p>
          <button 
            onClick={() => navigate(farmId ? `/farm/${farmId}/calculate` : '/dashboard')} 
            className="underline"
          >
            กลับไปหน้าคำนวณ
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  // 4. แยกข้อมูลออกมาเพื่อแสดงผล
  const inputs = calculationData.input;
  const results = calculationData.result;

  // 5. ฟังก์ชันยืนยันบันทึกลง DB
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem("token");
    if (!token) {
        navigate('/login');
        return;
    }

    // 6. สร้าง Payload ที่จะ "บันทึกจริง"
    // เราจะใช้ข้อมูล inputs และเพิ่ม estimated_yield ที่คำนวณได้
    const payload = {
      ...inputs,
      estimated_yield: results.estimated_yield 
    };

    try {
      // 7. ยิง API "Create" (ตัวจริง)
      const res = await fetch("http://localhost:4000/api/calculations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      
      alert("บันทึกข้อมูลสำเร็จ!");
      navigate("/dashboard"); // 👈 8. ไปหน้า Dashboard

    } catch (err) {
      alert(`บันทึกไม่สำเร็จ: ${err.message}`);
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <form onSubmit={handleSave} className="w-full max-w-lg">
          <h1 className="text-3xl font-bold text-green-900 mb-2 text-center">
            สรุปผลการคำนวณ
          </h1>
          <p className="text-lg text-gray-600 mb-8 text-center">
            กรุณาตรวจสอบข้อมูลและกดยืนยันเพื่อบันทึก
          </p>

          {/* Card 1: ผลลัพธ์ */}
          <div className="bg-white shadow-xl rounded-2xl p-6 mb-6 text-center">
            <p className="text-gray-700 text-lg">ผลผลิตที่คาดว่าจะได้</p>
            <p className="text-green-800 text-5xl font-bold my-2">
              {formatNum(results.estimated_yield, 0)}
            </p>
            <p className="text-gray-700 text-lg">กก.</p>
          </div>

          {/* Card 2: ข้อมูลที่ใช้คำนวณ */}
          <div className="bg-white shadow-xl rounded-2xl p-6 mb-8 text-left space-y-2">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">ข้อมูลที่ใช้</h3>
            <p><strong>จังหวัด:</strong> {inputs.location}</p>
            <p><strong>พื้นที่:</strong> {formatNum(inputs.area_rai, 2)} ไร่</p>
            <p><strong>คุณภาพ:</strong> {inputs.quality}</p>
            <p><strong>อายุต้น:</strong> {formatNum(inputs.tree_age_avg, 1)} ปี</p>
            <p><strong>เดือนเก็บเกี่ยว:</strong> {formatNum(inputs.harvest_month)}</p>
            <hr className="my-2"/>
            <p className="text-sm text-gray-500">
              ค่าเฉลี่ยจังหวัด: {formatNum(results.baseline_avg_per_rai, 0)} กก./ไร่
            </p>
            <p className="text-sm text-gray-500">
              Factor ฤดูกาล: {formatNum(results.season_factor, 2)}
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              type="submit"
              className="bg-green-700 text-white font-bold py-3 px-10 rounded-full text-lg shadow-md hover:bg-green-800 transition disabled:bg-gray-400"
              disabled={isSaving}
            >
              {isSaving ? "กำลังบันทึก..." : "ยืนยันการบันทึก"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)} // 👈 ปุ่มกดย้อนกลับ
              className="mt-3 text-gray-600 underline"
              disabled={isSaving}
            >
              ยกเลิก (กลับไปแก้ไข)
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}