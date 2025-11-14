import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Calculate() {
  const navigate = useNavigate();
  const { farmId } = useParams(); // 👈 1. ดึง farmId จาก URL

  // State สำหรับข้อมูลฟาร์ม
  const [farmData, setFarmData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State สำหรับช่องกรอก (Input)
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [quality, setQuality] = useState("");
  const [month, setMonth] = useState("");
  const [age, setAge] = useState("");
  
  // 2. ดึงข้อมูลฟาร์ม (โค้ดเดิม)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!farmId || farmId === "undefined") {
      console.error("Calculate Page: Invalid farmId from URL:", farmId);
      alert("ไม่พบ ID ของฟาร์ม (ID ผิดพลาด), กลับไปที่หน้า Dashboard");
      navigate("/dashboard");
      return; 
    }
    const fetchFarmData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`http://localhost:4000/api/farms/${farmId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "ไม่พบข้อมูลฟาร์ม");
        }
        const data = await res.json();
        setFarmData(data); 
      } catch (err) {
        console.error("Fetch Farm Data Error:", err.message);
        alert(err.message);
        if (err.message.includes("not found")) {
            navigate("/dashboard");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchFarmData();
  }, [farmId, navigate]); 

  // ⭐️ 4. ฟังก์ชัน "ดูสรุป" (เปลี่ยนจาก "Save" เป็น "Preview")
  const handlePreview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    if (!farmData || !token || !location || !area) {
      alert("กรุณากรอกจังหวัดและพื้นที่ (ต้องมากกว่า 0)");
      return;
    }

    // Payload เหมือนเดิม
    const payload = {
      farm_id: parseInt(farmId),
      crop_type_id: farmData.crop_type_id,
      location: location,
      area_rai: parseFloat(area),
      quality: quality || "ปานกลาง", // ใส่ค่า default ถ้าไม่กรอก
      harvest_month: parseInt(month) || null,
      tree_age_avg: parseFloat(age) || null,
      calc_date: new Date().toISOString().split('T')[0] // ใช้วันที่ปัจจุบัน
    };

    try {
      // ⭐️ เปลี่ยน API Endpoint เป็น /preview
      const res = await fetch("http://localhost:4000/api/calculations/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json(); // data คือ { preview: true, input: {...}, result: {...} }
      if (!res.ok) throw new Error(data.error || "คำนวณไม่สำเร็จ");
      
      alert("คำนวณผลผลิตสำเร็จ! กำลังไปหน้าสรุปผล...");
      
      // ⭐️ 5. ส่งข้อมูล (data) ทั้งหมดไปที่หน้า Summary ผ่าน state
      navigate(`/farm/${farmId}/summary`, { state: { calculationData: data } }); 

    } catch (err) {
      alert(`คำนวณไม่สำเร็จ: ${err.message}`);
    }
  };

  if (isLoading) {
    // ( ... โค้ดเดิม ... )
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>กำลังโหลดข้อมูลฟาร์ม...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        
        {/* ⭐️ เปลี่ยน onSubmit เป็น handlePreview */}
        <form
          onSubmit={handlePreview} 
          className="bg-white shadow-md rounded-xl p-6 w-full max-w-lg md:max-w-xl"
        >
          <h1 className="text-green-800 font-bold text-xl mb-4 text-left">
            คำนวณผลผลิต
          </h1>
          
          <div className="mb-3 p-3 bg-green-50 rounded-lg">
            <p className="font-semibold">ฟาร์ม: {farmData?.name}</p>
            <p className="text-sm text-gray-600">พืช: {farmData?.crop_name}</p>
          </div>

          {/* ( ... inputs ทั้งหมด ... โค้ดเดิม ... ) */}
          <label className="block text-gray-700 mb-1">จังหวัด (เช่น "เชียงใหม่")</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 mb-3"
            placeholder="สำคัญมากสำหรับการคำนวณ"
            required
          />
          <label className="block text-gray-700 mb-1">พื้นที่ (ไร่)</label>
          <input
            type="number"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 mb-3"
            placeholder="0.00"
            required
          />
          <label className="block text-gray-700 mb-1">อายุต้นเฉลี่ย (ปี)</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 mb-3"
            placeholder="เช่น 5 (ถ้าไม่ทราบ เว้นว่างได้)"
          />
          <label className="block text-gray-700 mb-1">คุณภาพการดูแล</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 mb-3 bg-white"
          >
            <option value="">เลือกคุณภาพ (ค่าเริ่มต้น: ปานกลาง)</option>
            <option value="ดีมาก">ดีมาก</option>
            <option value="ปานกลาง">ปานกลาง</option>
            <option value="ต่ำ">ต่ำ</option>
          </select>
          <label className="block text-gray-700 mb-1">เดือนเก็บเกี่ยว (1-12)</label>
          <input
            type="number"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 mb-4"
            placeholder="เช่น 11 (ถ้าไม่ทราบ เว้นว่างได้)"
          />
          
          {/* ⭐️ เปลี่ยนข้อความปุ่ม */}
          <button
            type="submit"
            className="bg-green-700 text-white px-8 py-2 rounded-full shadow hover:bg-green-800 transition w-full"
          >
            ดูสรุปผลการคำนวณ
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}