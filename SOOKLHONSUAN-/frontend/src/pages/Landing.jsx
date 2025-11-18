import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5] text-gray-800">
      {/* ใช้ Header เดิม */}
      <Header />

      {/* เนื้อหา Landing */}
      <main className="flex flex-col flex-1 items-center justify-center px-6 py-12 text-center">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-800 mb-4 leading-tight">
            สุขล้นสวน
          </h1>
          <p className="text-gray-700 text-base sm:text-lg md:text-xl mb-8">
            ผู้ช่วยอัจฉริยะของเกษตรกรรุ่นใหม่ <br className="hidden sm:block" />
            คำนวณ – วางแผน – ติดตามผลผลิต ได้ในที่เดียว
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="bg-green-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow hover:bg-green-800 transition w-full sm:w-auto"
            >
              เริ่มต้นใช้งาน
            </Link>
            <Link
              to="/register"
              className="border border-green-700 text-green-800 px-6 py-3 rounded-full text-lg font-semibold hover:bg-green-50 transition w-full sm:w-auto"
            >
              สมัครใช้งาน
            </Link>
          </div>
        </div>
      </main>

      {/* ส่วนฟีเจอร์ */}
      <section className="bg-white py-12 px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            "คำนวณผลผลิตจากจำนวนต้น",
            "ดูแนวโน้มผลผลิตด้วยกราฟ",
            "บันทึกผลและเปรียบเทียบรอบก่อนหน้า",
            "ประเมินมูลค่าสวนอัตโนมัติ",
          ].map((text, i) => (
            <div
              key={i}
              className="bg-green-50 rounded-xl p-6 text-center shadow hover:shadow-md transition"
            >
              <p className="text-green-900 font-medium">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/*  ใช้ Footer เดิม */}
      <Footer />
    </div>
  );
}
