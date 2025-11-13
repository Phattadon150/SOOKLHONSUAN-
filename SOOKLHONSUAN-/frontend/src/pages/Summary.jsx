import Navbar from "../components/Navbar"; 
import Footer from "../components/Footer";

export default function Summary() {
  // ข้อมูลตัวอย่างจากในรูป
  const currentYield = 2500.0;
  const prevYield = 1500.0;
  const difference = currentYield - prevYield;
  const percentageDiff = ((difference / prevYield) * 100).toFixed(2); // +66.67

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* ใช้ max-w-lg (32rem) เพื่อให้ความกว้างใกล้เคียงกับในรูป */}
        <div className="w-full max-w-lg text-center">
          
          <h1 className="text-3xl font-bold text-green-900 mb-2">
            สรุปผลและบันทึกผล
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            เปรียบเทียบผลผลิตกับรอบก่อนหน้า
          </p>

          {/* Card 1: ผลผลิตรอบนี้ */}
          <div className="bg-white shadow-xl rounded-2xl p-6 mb-6 text-left">
            <p className="text-gray-700 text-lg">ผลผลิตรอบนี้</p>
            <p className="text-green-800 text-3xl font-bold">
              {currentYield.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              กก.
            </p>
          </div>

          {/* Card 2: ผลผลิตรอบก่อนหน้า */}
          <div className="bg-white shadow-xl rounded-2xl p-6 mb-6 text-left">
            <p className="text-gray-700 text-lg">ผลผลิตรอบก่อนหน้า</p>
            <p className="text-gray-900 text-3xl font-bold">
              {prevYield.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              กก.
            </p>
          </div>

          {/* Card 3: ส่วนต่าง (ใช้สี bg-green-200 ตามรูป) */}
          <div className="bg-green-200 shadow-xl rounded-2xl p-6 mb-8 text-left">
            <p className="text-green-900 text-lg">ส่วนต่าง</p>
            <p className="text-green-900 text-3xl font-bold">
              {difference.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              กก.
            </p>
            <p className="text-green-700 text-xl font-medium">
              (+{percentageDiff}%)
            </p>
          </div>

          {/* ข้อมูลและปุ่มบันทึก */}
          <div className="mt-4">
            <p className="text-gray-700">บันทึกข้อมูล</p>
            <p className="text-gray-700 font-semibold mb-6">
              วันที่บันทึก 12 มิถุนายน 2568
            </p>
            <button className="bg-green-700 text-white font-bold py-3 px-10 rounded-full text-lg shadow-md hover:bg-green-800 transition">
              บันทึกข้อมูล
            </button>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}