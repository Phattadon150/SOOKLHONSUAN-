import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import Header from "../components/Header"; 
import Footer from "../components/Footer"; 

export default function FarmForm() {
  const navigate = useNavigate();
  const [farmName, setFarmName] = useState("");
  
  // --- 🌟 1. แก้ไข State ---
  // state นี้จะเก็บ "ID" ของพืชที่เลือก (เช่น "1", "2") ไม่ใช่ "ชื่อ"
  const [selectedCropId, setSelectedCropId] = useState(""); 
  
  // state นี้จะเก็บ List ของพืชที่ได้จาก API
  const [cropTypesList, setCropTypesList] = useState([]); 
  
  // state สำหรับการโหลด
  const [isLoading, setIsLoading] = useState(true);

  // ลบ 2 บรรทัดนี้ออก - เราจะดึงข้อมูลจาก API แทน
  // const user = localStorage.getItem("currentUser");
  // const cropOptions = ["ลำไย", "มะนาว", "มะกรูด", "พริก", "มะม่วง"];

  // --- 🌟 2. เพิ่ม useEffect (ดึงข้อมูลพืชจาก API) ---
  useEffect(() => {
    // ฟังก์ชันสำหรับดึงข้อมูลพืช
    const fetchCropTypes = async () => {
      try {
        // (API นี้ไม่ต้องใช้ Token ตามโค้ด backend ของคุณ)
        const response = await fetch("http://localhost:4000/api/crop-types");
        
        if (!response.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูลชนิดพืชได้");
        }
        
        const data = await response.json();
        setCropTypesList(data); // เก็บ Array ที่ได้จาก API (เช่น [{id: 1, name: 'ลำไย'}, ...])
        
      } catch (error) {
        console.error("Fetch crop types error:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูลพืช: " + error.message);
      } finally {
        setIsLoading(false); // โหลดเสร็จแล้ว (ไม่ว่าจะสำเร็จหรือล้มเหลว)
      }
    };

    fetchCropTypes(); // สั่งให้ฟังก์ชันนี้ทำงานตอนหน้าเว็บโหลด
  }, []); // [] หมายถึงให้ทำงานแค่ครั้งเดียว

  
  // --- 🌟 3. แก้ไข handleSubmit (ส่งข้อมูลไป Backend) ---
  const handleSubmit = async (e) => { // 👈 เปลี่ยนเป็น async
    e.preventDefault();
    if (!farmName || !selectedCropId) {
      alert("กรุณากรอกชื่อสวนและเลือกพืช");
      return;
    }

    // ดึง Token ที่ได้จากหน้า Login
    const token = localStorage.getItem("token");
    if (!token) {
      alert("ไม่พบข้อมูลผู้ใช้, กรุณาเข้าสู่ระบบใหม่");
      navigate("/login");
      return;
    }
    
    // เตรียมข้อมูลที่จะส่งไป Backend
    const payload = {
      name: farmName,
      crop_type_id: parseInt(selectedCropId) // ส่ง "ID" ที่เลือก
    };

    try {
      // ยิง API ไปที่ Backend
      const response = await fetch("http://localhost:4000/api/farms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // 👈 สำคัญมาก! แนบ Token ไปด้วย
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();

      if (!response.ok) {
        // ถ้า Backend ตอบ Error กลับมา
        throw new Error(data.error || "มีบางอย่างผิดพลาด");
      }

      // ถ้าสำเร็จ
      alert("สร้างฟาร์มสำเร็จ!");
      navigate("/dashboard"); // ไปหน้า Dashboard

    } catch (error) {
      console.error("Create farm error:", error);
      alert("เกิดข้อผิดพลาดในการสร้างฟาร์ม: " + error.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-xl p-6 w-full max-w-sm space-y-4"
        >
          <h1 className="text-center text-green-800 font-bold text-lg">
            กรอกชื่อสวน
          </h1>

          <input
            type="text"
            placeholder="ชื่อสวน"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
          />

          <h2 className="text-center font-semibold text-gray-600 mt-4">
            เลือกพืชที่ปลูก
          </h2>

          {/* --- 🌟 4. แก้ไข <select> ให้ดึงจาก State --- */}
          <select
            value={selectedCropId} // 👈 value ตอนนี้คือ "ID" (เช่น "1")
            onChange={(e) => setSelectedCropId(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
            disabled={isLoading} // 👈 ปิดปุ่มตอนกำลังโหลด
          >
            <option value="">
              {isLoading ? "กำลังโหลดข้อมูลพืช..." : "-- เลือกพืช --"}
            </option>
            
            {/* วนลูปจาก cropTypesList (ที่ได้จาก API) */}
            {cropTypesList.map((crop) => (
              <option key={crop.id} value={crop.id}> {/* 👈 value คือ ID */}
                {crop.name} {/* 👈 ข้อความที่แสดงคือ Name */}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-full shadow hover:bg-green-800"
            disabled={isLoading} // 👈 ปิดปุ่มตอนกำลังโหลด
          >
            {/* 🌟 5. แก้ไขชื่อปุ่ม */}
            บันทึกสวน
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}