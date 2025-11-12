import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ ต้องมีเพื่อใช้ navigate
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate(); // ✅ ใช้เปลี่ยนหน้า
  const user = localStorage.getItem("currentUser");
  const farmData = JSON.parse(localStorage.getItem(`farmData_${user}`));

  const farmName = farmData?.farmName || "ชื่อสวนของคุณ";
  const crop = farmData?.crop || null;

  // ✅ เตรียมข้อมูล ProductCard จากสิ่งที่เลือกใน FarmForm
  const data = crop
    ? [
        {
          name: crop,
          area: 5,
          diff: 0,
          quality: "ยังไม่มีข้อมูลคุณภาพ",
          month: "ยังไม่มีเดือนเก็บเกี่ยว",
        },
      ]
    : [];

  const hasData = data.length > 0;

  // ✅ ฟังก์ชัน state สำหรับ “เพิ่มผลผลิต”
  const [adding, setAdding] = useState(false);
  const [newCrop, setNewCrop] = useState("");

  const handleAddCrop = () => {
    if (!newCrop) {
      alert("กรุณาเลือกพืชก่อน");
      return;
    }

    // จำลองเพิ่มพืชใหม่ (จริง ๆ ควรเก็บใน localStorage เพิ่มเป็น array ของพืชในอนาคต)
    navigate(`/product/${newCrop}`);
  };

  // กราฟ mock เหมือนเดิม
  const graphData = [
    { name: "รอบที่ 1", "ผลผลิตที่ได้จริง": 1500 },
    { name: "รอบที่ 2", "ผลผลิตที่คาดหวัง": 2500 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 p-4">
        {/* ชื่อสวน */}
        <h1 className="text-center text-xl font-bold text-green-800 mb-2">
          {farmName}
        </h1>
        <p className="text-center text-gray-600 mb-4">แสดงภาพรวมของสวน</p>

        {/* กราฟ */}
        <div className="bg-white shadow-md rounded-xl p-6 mb-4">
          <h2 className="text-center text-green-900 font-semibold mb-3">
            แนวโน้มผลผลิต
          </h2>
          <div className="h-72 w-full min-w-[300px] min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ผลผลิตที่ได้จริง" fill="#ef4444" />
                <Bar dataKey="ผลผลิตที่คาดหวัง" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ส่วนผลผลิต */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-green-900 font-semibold">ผลผลิต</h2>

          {/* ✅ ปุ่มเพิ่มผลผลิตพร้อม dropdown */}
          {adding ? (
            <div className="flex items-center space-x-3">
              <select
                value={newCrop}
                onChange={(e) => setNewCrop(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1"
              >
                <option value="">-- เลือกพืช --</option>
                <option value="ลำไย">ลำไย</option>
                <option value="มะนาว">มะนาว</option>
                <option value="พริก">พริก</option>
                <option value="มะม่วง">มะม่วง</option>
                <option value="มะกรูด">มะกรูด</option>
              </select>
              <button
                onClick={handleAddCrop}
                className="bg-green-700 text-white px-3 py-1 rounded-lg hover:bg-green-800"
              >
                ไปยังรายละเอียด
              </button>
              <button
                onClick={() => setAdding(false)}
                className="bg-gray-300 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-400"
              >
                ✖
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="text-sm bg-green-700 text-white px-3 py-1 rounded-full shadow hover:bg-green-800 transition"
            >
              + เพิ่มผลผลิต
            </button>
          )}
        </div>

        {/* แสดงผลผลิต */}
        {hasData ? (
          data.map((item, i) => (
            <ProductCard
              key={i}
              name={item.name}
              area={item.area}
              diff={item.diff}
              quality={item.quality}
              month={item.month}
              onView={() => navigate(`/product/${item.name}`)} // ✅ ดูรายละเอียด
            />
          ))
        ) : (
          <div className="bg-white shadow rounded-xl p-6 text-center text-gray-500">
            ยังไม่มีข้อมูลสวนของคุณ
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
