import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
// นำเข้า Components ที่จำเป็นจาก Recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const farmData = JSON.parse(localStorage.getItem("farmData"));
  const farmName = farmData?.farmName || "ชื่อสวนของคุณ";

  const data = [
    // { name: "มะนาว", area: 5, diff: -10 },
    // { name: "มะกรูด", area: 5, diff: -10 },
    // เพิ่มข้อมูลตามที่แสดงในรูปภาพเพื่อแสดงใน ProductCard
    { name: "มะนาว", area: 5, diff: -10 },
    { name: "มะนาว", area: 5, diff: -10 },
    { name: "มะนาว", area: 5, diff: -10 },
  ];

  // ข้อมูลสำหรับกราฟผลผลิต: แยกสีแดง (รอบ 1) และสีเขียว (รอบ 2)
  const graphData = [
    {
      name: 'รอบที่ 1', // ใช้เป็น label แกน X
      'ผลผลิตที่ได้จริง': 1500, // ค่าสำหรับแท่งสีแดง
      'ผลผลิตที่คาดหวัง': 0,    // ไม่ให้มีแท่งสีเขียวในรอบที่ 1
    },
    {
      name: 'รอบที่ 2', // ใช้เป็น label แกน X
      'ผลผลิตที่ได้จริง': 0,    // ไม่ให้มีแท่งสีแดงในรอบที่ 2
      'ผลผลิตที่คาดหวัง': 2500, // ค่าสำหรับแท่งสีเขียว
    }
  ];

  const hasData = data.length > 0;
  const hasGraph = true; // ตั้งเป็น true เพื่อแสดงกราฟ

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 p-4">
        <h1 className="text-center text-xl font-bold text-green-800 mb-2">
          {farmName}
        </h1>
        <p className="text-center text-gray-600 mb-4">
          แสดงภาพรวมของสวน
        </p>

        <div className="bg-white shadow-md rounded-xl p-6 mb-4">
          <h2 className="text-center text-green-900 font-semibold mb-3">แนวโน้มผลผลิต</h2>
          
          {hasGraph ? (
            // เปลี่ยนจาก [กราฟแนวโน้มผลผลิต] เป็น BarChart
            <div className="h-72 w-full"> {/* ใช้ h-72 เหมือนเดิม */}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={graphData}
                  margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    label={{ value: 'กิโลกรัม', angle: -90, position: 'insideLeft', fill: '#4b5563' }}
                    domain={[0, 3000]} // กำหนดขอบเขต Y-Axis ตามรูป
                    tickCount={7} // จำนวนขีดตามรูป
                  />
                  <Tooltip />
                  <Legend
                    verticalAlign="top"
                    align="center"
                    wrapperStyle={{ paddingTop: '10px' }}
                    // Legend ที่ถูกปรับให้แสดงชื่อตามความหมายของสี
                    formatter={(value, entry) => {
                       if (value === 'ผลผลิตที่ได้จริง') return 'รอบที่ 1 (สีแดง)';
                       if (value === 'ผลผลิตที่คาดหวัง') return 'รอบที่ 2 (สีเขียว)';
                       return value;
                    }}
                  />
                  {/* แท่งสีแดง (รอบที่ 1) */}
                  <Bar dataKey="ผลผลิตที่ได้จริง" stackId="b" fill="#ef4444" name="รอบที่ 1" />
                  {/* แท่งสีเขียว (รอบที่ 2) */}
                  <Bar dataKey="ผลผลิตที่คาดหวัง" stackId="b" fill="#10b981" name="รอบที่ 2" />
                </BarChart>
              </ResponsiveContainer>
              
              {/* <--- ลบออกแล้ว ---> */}
              {/* <p className="text-center text-gray-600 mt-2 font-semibold">ผลผลิต</p> */}
              
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              ยังไม่มีกราฟแสดง
            </div>
          )}
        </div>

        <h2 className="text-green-900 font-semibold mb-3">ผลผลิต</h2>

        {hasData ? (
          data.map((item, i) => (
            <ProductCard
              key={i}
              name={item.name}
              area={item.area}
              diff={item.diff}
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