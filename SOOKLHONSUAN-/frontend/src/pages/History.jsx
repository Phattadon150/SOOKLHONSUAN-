import Navbar from "../components/Navbar"; // (ปรับ path ถ้าจำเป็น)
import Footer from "../components/Footer"; // (ปรับ path ถ้าจำเป็น)
import { useState, useEffect } from "react";

// --- ข้อมูลจำลอง (Mock Data) ---
// ข้อมูลนี้ควรจะดึงมาจาก API หรือ localStorage
const historyStats = {
  max: 2500,
  min: 1500,
  avg: 2000,
};

const historyItems = [
  {
    id: 1,
    date: "12 มิถุนายน 2568",
    trees: 15,
    avgWeight: "25.00",
    totalYield: "750.00", // (ตัวเลขตามในรูป)
  },
  {
    id: 2,
    date: "12 มิถุนายน 2568",
    trees: 15,
    avgWeight: "25.00",
    totalYield: "750.00", // (ตัวเลขตามในรูป)
  },
];
// --- จบส่วนข้อมูลจำลอง ---

export default function History() {
  // (ในอนาคต คุณสามารถใช้ state เพื่อเก็บข้อมูลที่ fetch มา)
  // const [stats, setStats] = useState(historyStats);
  // const [items, setItems] = useState(historyItems);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <Navbar />

      {/* ใช้ max-w-3xl (768px) เพื่อให้บน Desktop ไม่กว้างเกินไป 
        และ mx-auto เพื่อจัดกลาง 
      */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-green-900 mb-2">
          ประวัติ
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          ข้อมูลการคำนวณผลผลิตย้อนหลัง
        </p>

        {/* Card: สรุปค่าสถิติ */}
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-3 divide-x divide-gray-200 text-center">
            <div>
              <p className="text-sm text-gray-500">ค่าสูงสุด</p>
              <p className="text-xl font-bold text-green-800">
                {historyStats.max.toLocaleString("th-TH")} กก.
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ค่าต่ำสุด</p>
              <p className="text-xl font-bold text-gray-800">
                {historyStats.min.toLocaleString("th-TH")} กก.
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ค่าเฉลี่ย</p>
              <p className="text-xl font-bold text-gray-800">
                {historyStats.avg.toLocaleString("th-TH")} กก.
              </p>
            </div>
          </div>
        </div>

        {/* Card: กราฟแนวโน้ม */}
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-green-900 mb-4">
            แนวโน้มผลผลิตตามช่วงเวลา
          </h2>
          {/* ส่วนนี้สำหรับใส่ Chart Library เช่น Chart.js หรือ Recharts
            ผมจะสร้างกราฟจำลองขึ้นมาแทนก่อนครับ
          */}
          <div className="w-full h-64 bg-gray-50 border border-gray-200 rounded-lg p-4 relative">
            {/* แกน Y Labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
              <span>3000</span>
              <span>1500</span>
              <span>0</span>
            </div>
            {/* พื้นที่กราฟ */}
            <div className="w-full h-full border-b border-l border-gray-300 ml-7">
              {/* เส้นกราฟ (SVG) */}
              <svg 
                className="w-full h-full" 
                preserveAspectRatio="none" 
                viewBox="0 0 100 100"
              >
                {/* จุดที่ 1 (รอบ 1): X=25, Y=40 (100 - (1800/3000 * 100))
                  จุดที่ 2 (รอบ 2): X=75, Y=6.7 (100 - (2800/3000 * 100))
                  (ตัวเลข Y จำลองตามในรูป)
                */}
                <polyline 
                  points="25,40 75,10" 
                  stroke="#818cf8" /* indigo-400 */
                  strokeWidth="3" 
                  fill="none" 
                />
                <circle cx="25" cy="40" r="3" fill="#818cf8" />
                <circle cx="75" cy="10" r="3" fill="#818cf8" />
              </svg>
            </div>
            {/* แกน X Labels */}
            <div className="absolute bottom-0 left-0 w-full flex justify-around ml-7">
              <span className="text-xs text-gray-500">รอบที่ 1</span>
              <span className="text-xs text-gray-500">รอบที่ 2</span>
            </div>
          </div>
        </div>

        {/* ส่วน: รายการบันทึกทั้งหมด */}
        <div>
          <h2 className="text-lg font-semibold text-green-900 mb-4">
            รายการบันทึกทั้งหมด ({historyItems.length} รายการ)
          </h2>
          
          <div className="flex flex-col gap-4">
            {/* วนลูปแสดงผล Card */}
            {historyItems.map((item) => (
              <div key={item.id} className="bg-white shadow-xl rounded-2xl p-5">
                
                {/* แถวบน: ลำดับและวันที่ */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold text-sm">
                    {item.id}
                  </span>
                  <span className="font-semibold text-gray-800">{item.date}</span>
                </div>

                {/* แถวกลาง: ข้อมูลสถิติ */}
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div>
                    <p className="text-sm text-gray-500">จำนวนต้น</p>
                    <p className="font-semibold text-gray-900">{item.trees}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">น้ำหนักเฉลี่ย</p>
                    <p className="font-semibold text-gray-900">{item.avgWeight} กก.</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ผลผลิตรวม</p>
                    <p className="font-bold text-green-700">{item.totalYield} กก.</p>
                  </div>
                </div>

                {/* แถวล่าง: ปุ่ม (เว้นขอบบนตามดีไซน์) */}
                <div className="flex justify-end gap-3 border-t border-gray-100 pt-3 mt-3">
                  <button className="text-sm border border-green-600 text-green-600 px-4 py-1 rounded-full hover:bg-green-50 transition-colors">
                    ดูรายละเอียด
                  </button>
                  <button className="text-sm border border-red-500 text-red-500 px-4 py-1 rounded-full hover:bg-red-50 transition-colors">
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}