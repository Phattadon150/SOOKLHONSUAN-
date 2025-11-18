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
  const farmData = JSON.parse(localStorage.getItem("farmData"));
  const farmName = farmData?.farmName || "ชื่อสวนของคุณ";

  const data = [
    { name: "มะนาว", area: 5, diff: -10 },
    { name: "มะกรูด", area: 5, diff: -10 },
    { name: "พริก", area: 5, diff: -10 },
  ];

  // ✅ ตัวอย่างข้อมูลกราฟ
  const graphData = [
    {
      name: "รอบที่ 1",
      "ผลผลิตที่ได้จริง": 1500,
      "ผลผลิตที่คาดหวัง": 0,
    },
    {
      name: "รอบที่ 2",
      "ผลผลิตที่ได้จริง": 0,
      "ผลผลิตที่คาดหวัง": 2500,
    },
  ];

  const hasData = data.length > 0;
  const hasGraph = true;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 p-4">
        {/* ชื่อสวน */}
        <h1 className="text-center text-xl font-bold text-green-800 mb-2">
          {farmName}
        </h1>
        <p className="text-center text-gray-600 mb-4">แสดงภาพรวมของสวน</p>

        {/* กราฟผลผลิต */}
        <div className="bg-white shadow-md rounded-xl p-6 mb-4">
          <h2 className="text-center text-green-900 font-semibold mb-3">
            แนวโน้มผลผลิต
          </h2>

          {hasGraph ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={graphData}
                  margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    label={{
                      value: "กิโลกรัม",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#4b5563",
                    }}
                    domain={[0, 3000]}
                    tickCount={7}
                  />
                  <Tooltip />
                  <Legend
                    verticalAlign="top"
                    align="center"
                    wrapperStyle={{ paddingTop: "10px" }}
                    formatter={(value) => {
                      if (value === "ผลผลิตที่ได้จริง") return "รอบที่ 1 (สีแดง)";
                      if (value === "ผลผลิตที่คาดหวัง") return "รอบที่ 2 (สีเขียว)";
                      return value;
                    }}
                  />
                  <Bar
                    dataKey="ผลผลิตที่ได้จริง"
                    stackId="b"
                    fill="#ef4444"
                    name="รอบที่ 1"
                  />
                  <Bar
                    dataKey="ผลผลิตที่คาดหวัง"
                    stackId="b"
                    fill="#10b981"
                    name="รอบที่ 2"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              ยังไม่มีกราฟแสดง
            </div>
          )}
        </div>

        {/* หัวข้อผลผลิต + ปุ่มเพิ่มพืช */}
        <h2 className="text-green-900 font-semibold mb-3 flex items-center justify-between">
          ผลผลิต
          <button
            onClick={() =>
              alert("ฟังก์ชันเพิ่มพืชจะเชื่อมกับ FarmForm หรือ Backend ในอนาคต")
            }
            className="text-sm bg-green-700 text-white px-3 py-1 rounded-full shadow hover:bg-green-800 transition"
          >
            + เพิ่มพืช
          </button>
        </h2>

        {/* การ์ดผลผลิต */}
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
