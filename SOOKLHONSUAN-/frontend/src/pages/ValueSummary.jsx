import Navbar from "../components/Navbar"; // (ปรับ path ถ้าจำเป็น)
import Footer from "../components/Footer"; // (ปรับ path ถ้าจำเป็น)
import { useState } from "react";

export default function ValueSummary() {
  const [calculationMode, setCalculationMode] = useState("marketPrice");

  // คำนวณองศาสำหรับกราฟ
  // รอบ 1: 1500 กก. (37.5%)
  // รอบ 2: 2500 กก. (62.5%)
  // รวม 4000 กก.
  const round1_degrees = 0.375 * 360; // 135deg
  const round2_start = round1_degrees; // 135deg

  // สีจาก Tailwind (ตรงกับใน Legend)
  const colorRound1 = "#818cf8"; // indigo-400
  const colorRound2 = "#f87171"; // red-400

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <Navbar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-900 mb-2">
            สรุปมูลค่าสวน
          </h1>
          <p className="text-lg text-gray-600">
            ประเมินมูลค่าผลผลิตรวมของคุณ
          </p>
        </div>

        {/* Card 1: ผลผลิตล่าสุด */}
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-6 text-center">
          <p className="text-gray-700 text-lg">ผลผลิตล่าสุด</p>
          <p className="text-green-800 text-4xl font-bold">
            134.50 <span className="text-2xl font-medium">กก.</span>
          </p>
        </div>

        {/* Section: คำนวณมูลค่า */}
        <h2 className="text-xl font-semibold text-green-900 mb-4">
          คำนวณมูลค่า
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Option 1: ราคากลาง */}
          <button
            onClick={() => setCalculationMode("marketPrice")}
            className={`bg-white shadow-xl rounded-2xl p-4 text-left transition-all ${
              calculationMode === "marketPrice"
                ? "ring-2 ring-green-600"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <span className="font-semibold text-gray-800">
              ใช้ราคากลาง
            </span>
            <p className="text-red-600 text-sm">(60.00 กก.)</p>
          </button>
          
          {/* Option 2: กรอกราคาเอง */}
          <button
            onClick={() => setCalculationMode("customPrice")}
            className={`bg-white shadow-xl rounded-2xl p-4 text-left transition-all ${
              calculationMode === "customPrice"
                ? "ring-2 ring-green-600"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <span className="font-semibold text-gray-800">
              กรอกราคาที่ขายได้จริง
            </span>
            <p className="text-gray-500 text-sm">(ยังไม่กรอก)</p>
          </button>
        </div>

        {/* Section: สัดส่วนมูลค่าต่อรอบ */}
        <h2 className="text-xl font-semibold text-green-900 mb-4">
          สัดส่วนมูลค่าต่อรอบ
        </h2>
        
        {/* Card 2: กราฟและคำอธิบาย */}
        <div className="bg-white shadow-xl rounded-2xl p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            
            {/* ✅ นี่คือส่วนที่อัปเดตครับ
              กราฟวงกลมที่สร้างด้วย CSS Conic Gradient 
            */}
            <div className="flex-shrink-0 mx-auto">
              <div 
                className="w-48 h-48 rounded-full"
                style={{ 
                  background: `conic-gradient(
                    from -90deg, 
                    ${colorRound1} 0deg ${round1_degrees}deg, 
                    ${colorRound2} ${round1_degrees}deg 360deg
                  )`
                  // -90deg = เริ่มที่ 12 นาฬิกา (ด้านบน)
                  // สีรอบ 1 (Blue) = 0deg ถึง 135deg (37.5%)
                  // สีรอบ 2 (Red) = 135deg ถึง 360deg (62.5%)
                }}
              >
                {/* ตัวกราฟ ไม่ต้องมี text ด้านใน */}
              </div>
            </div>

            {/* คำอธิบายและเคล็ดลับ (ด้านขวาบน Desktop) */}
            <div className="flex-1 w-full">
              {/* Legend (คำอธิบาย) */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-indigo-400"></span>
                  <span>รอบที่ 1 - 1500 กิโลกรัม (37.50%)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-red-400"></span>
                  <span>รอบที่ 2 - 2500 กิโลกรัม (62.50%)</span>
                </div>
              </div>

              {/* เคล็ดลับ (จากรูป Desktop) */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-800">
                  เคล็ดลับ:
                </p>
                <p className="text-sm text-gray-600">
                  ราคาจะขึ้นสูงในช่วง (เดือนกรกฎาคม–สิงหาคม)
                  วางแผนการปลูกให้ผลผลิตในช่วงที่ราคาตลาดสูง
                  จะช่วยเพิ่มรายได้
                </p>
              </div>
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}