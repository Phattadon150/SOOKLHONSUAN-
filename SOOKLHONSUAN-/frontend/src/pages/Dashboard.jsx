  import Header from "../components/Header";
  import Footer from "../components/Footer";
  import ProductCard from "../components/ProductCard";

  export default function Dashboard() {
    const farmData = JSON.parse(localStorage.getItem("farmData"));
    const farmName = farmData?.farmName || "ชื่อสวนของคุณ";

    const data = [
      // { name: "มะนาว", area: 5, diff: -10 },
      // { name: "มะกรูด", area: 5, diff: -10 },
    ];

    const hasData = data.length > 0;
    const hasGraph = true;

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
            {hasGraph ? (
              <div className="h-48 flex items-center justify-center text-gray-400">
                [กราฟแนวโน้มผลผลิต]
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400">
                ยังไม่มีกราฟแสดง
              </div>
            )}
          </div>

          <h2 className="text-green-900 font-semibold mb-3 flex items-center justify-between">
    ผลผลิต
    <button
      onClick={() => alert("ฟังก์ชันเพิ่มพืชจะเชื่อมกับ FarmForm หรือ Backend ในอนาคต")}
      className="text-sm bg-green-700 text-white px-3 py-1 rounded-full shadow hover:bg-green-800 transition"
    >
      + เพิ่มพืช
    </button>
  </h2>

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
