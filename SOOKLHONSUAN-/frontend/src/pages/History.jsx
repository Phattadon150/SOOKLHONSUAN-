import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 👈 1. Import useNavigate
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"; // 👈 2. Import Recharts

// Helper: Format ตัวเลข
const formatNum = (num, digits = 0) => {
  const n = Number(num);
  if (!Number.isFinite(n)) return 0;
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export default function History() {
  const navigate = useNavigate(); // 👈 3. Setup navigate

  // --- 4. ใช้ State เก็บข้อมูลจาก API ---
  const [stats, setStats] = useState({ max: 0, min: 0, avg: 0 });
  const [items, setItems] = useState([]); // 👈 (สำหรับ List p-5)
  const [graphData, setGraphData] = useState([]); // 👈 (สำหรับ กราฟเส้น)
  const [isLoading, setIsLoading] = useState(true);

  // --- 5. ดึงข้อมูลจาก Backend ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // ดึงข้อมูลการคำนวณทั้งหมด (ตัวเดียวกับที่ Dashboard ใช้)
        const res = await fetch("http://localhost:4000/api/calculations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");

        const data = await res.json(); // data คือ Array [ {id: 1, ...}, {id: 2, ...} ]

        // 6. อัปเดต State รายการประวัติ (p-5)
        setItems(data);

        // 7. คำนวณสถิติ (Max, Min, Avg)
        if (data.length > 0) {
          const yields = data.map(d => d.estimated_yield).filter(Boolean); // เอาเฉพาะที่มีค่า
          const sum = yields.reduce((a, b) => a + b, 0);
          setStats({
            max: Math.max(...yields),
            min: Math.min(...yields),
            avg: sum / yields.length,
          });

          // 8. เตรียมข้อมูลให้ กราฟเส้น
          const formattedGraphData = data.map(calc => ({
            name: new Date(calc.calc_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
            "ผลผลิต": calc.estimated_yield,
          })).reverse(); // กลับด้านให้ "เก่า" อยู่ซ้าย
          setGraphData(formattedGraphData);
        }

      } catch (err) {
        alert(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // ⭐️ ฟังก์ชันสำหรับนำทางไปหน้าสรุปผล (Summary)
  const handleViewDetail = (calculationItem) => {
    // จัดรูปแบบข้อมูลให้ตรงกับที่หน้า Summary คาดหวัง
    const dataForSummary = {
      preview: false,
      input: { // ดึงข้อมูล Input ที่ใช้คำนวณจาก item
        farm_id: calculationItem.farm_id,
        crop_type_id: calculationItem.crop_type_id,
        location: calculationItem.location,
        area_rai: calculationItem.area_rai,
        quality: calculationItem.quality,
        harvest_month: calculationItem.harvest_month,
        tree_age_avg: calculationItem.tree_age_avg,
        calc_date: calculationItem.calc_date,
      },
      result: calculationItem // ส่งผลการคำนวณทั้งหมดไปในส่วน result
    };

    // ใช้ navigate เพื่อส่งไปหน้า Summary พร้อมส่งข้อมูลผ่าน state
    navigate(`/farm/${calculationItem.farm_id}/summary`, {
      state: { calculationData: dataForSummary }
    });
  };

  // (ฟังก์ชันสำหรับปุ่มลบ - ต้องไปสร้าง API ที่ Backend เพิ่ม)
  const handleDelete = async (id) => {
    if (!window.confirm(`คุณแน่ใจหรือว่าต้องการลบรายการที่ ${id}?`)) {
      return;
    }
    // (ต้องไปสร้าง API 'DELETE /api/calculations/:id' ที่ Backend ก่อน)
    alert(`(ยังไม่)ลบรายการ ${id} (ต้องสร้าง API ก่อน)`);
  };

  if (isLoading) {
    // (หน้า Loading)
    return (
      <div className="flex flex-col min-h-screen bg-stone-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p>กำลังโหลดข้อมูลประวัติ...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <Navbar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-green-900 mb-2">
          ประวัติ
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          ข้อมูลการคำนวณผลผลิตย้อนหลัง
        </p>

        {/* --- 9. Card: สรุปค่าสถิติ (ใช้ State) --- */}
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-3 divide-x divide-gray-200 text-center">
            <div>
              <p className="text-sm text-gray-500">ค่าสูงสุด</p>
              <p className="text-xl font-bold text-green-800">
                {formatNum(stats.max)} กก.
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ค่าต่ำสุด</p>
              <p className="text-xl font-bold text-gray-800">
                {formatNum(stats.min)} กก.
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ค่าเฉลี่ย</p>
              <p className="text-xl font-bold text-gray-800">
                {formatNum(stats.avg)} กก.
              </p>
            </div>
          </div>
        </div>

        {/* --- 10. Card: กราฟแนวโน้ม (ใช้ State และ Recharts) --- */}
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-green-900 mb-4">
            แนวโน้มผลผลิตตามช่วงเวลา
          </h2>
          {/* ⭐️ ใช้ Recharts แทน SVG จำลอง ⭐️ */}
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ผลผลิต" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- 11. ส่วน: รายการบันทึกทั้งหมด (ใช้ State) --- */}
        <div>
          <h2 className="text-lg font-semibold text-green-900 mb-4">
            รายการบันทึกทั้งหมด ({items.length} รายการ)
          </h2>

          <div className="flex flex-col gap-4">
            {/* ⭐️ วนลูปแสดงผล Card (p-5) จาก State ⭐️ */}
            {items.map((item, index) => (
              <div key={item.id} className="bg-white shadow-xl rounded-2xl p-5">

                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold text-sm">
                    {items.length - index} {/* (นับถอยหลัง) */}
                  </span>
                  <span className="font-semibold text-gray-800">
                    {new Date(item.calc_date).toLocaleDateString("th-TH", {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div>
                    <p className="text-sm text-gray-500">จังหวัด</p>
                    <p className="font-semibold text-gray-900">{item.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">พื้นที่ (ไร่)</p>
                    <p className="font-semibold text-gray-900">{formatNum(item.area_rai, 2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ผลผลิตคาดหวัง</p>
                    <p className="font-bold text-green-700">{formatNum(item.estimated_yield)} กก.</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-3 mt-3">
                  <button
                    // ⭐️ ผูกกับฟังก์ชัน handleViewDetail
                    onClick={() => handleViewDetail(item)}
                    className="text-sm border border-green-600 text-green-600 px-4 py-1 rounded-full hover:bg-green-50 transition-colors"
                  >
                    ดูรายละเอียด
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-sm border border-red-500 text-red-500 px-4 py-1 rounded-full hover:bg-red-50 transition-colors"
                  >
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