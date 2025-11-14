// Calculate.jsx (ฉบับเต็ม - อัปเดตฟอร์ม)

import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

// ⭐️ (ใหม่) 1. ข้อมูลสำหรับ Dropdown และ Autocomplete
const thaiMonths = [
  { value: "1", name: "มกราคม" },
  { value: "2", name: "กุมภาพันธ์" },
  { value: "3", name: "มีนาคม" },
  { value: "4", name: "เมษายน" },
  { value: "5", name: "พฤษภาคม" },
  { value: "6", name: "มิถุนายน" },
  { value: "7", name: "กรกฎาคม" },
  { value: "8", name: "สิงหาคม" },
  { value: "9", name: "กันยายน" },
  { value: "10", name: "ตุลาคม" },
  { value: "11", name: "พฤศจิกายน" },
  { value: "12", name: "ธันวาคม" },
];

// (รายการจังหวัดในไทยสำหรับ datalist)
const thaiProvinces = [
  "กระบี่", "กรุงเทพมหานคร", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", 
  "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", 
  "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", 
  "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", 
  "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", 
  "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", 
  "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", 
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", 
  "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", 
  "อุบลราชธานี"
];


export default function Calculate() {
  const navigate = useNavigate();
  const { farmId } = useParams();
  
  const routeLocation = useLocation();
  const { preloadData, originalCalculation } = routeLocation.state || {};

  // ( ... State ... เหมือนเดิม )
  const [farmData, setFarmData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState(preloadData?.location || "");
  const [area, setArea] = useState(preloadData?.area_rai?.toString() || "");
  const [quality, setQuality] = useState(preloadData?.quality || "");
  const [month, setMonth] = useState(preloadData?.harvest_month?.toString() || "");
  const [age, setAge] = useState(preloadData?.tree_age_avg?.toString() || "");

  // ( ... useEffect ดึงข้อมูลฟาร์ม ... เหมือนเดิม )
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

  // ( ... handlePreview ... เหมือนเดิม )
  const handlePreview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    if (!farmData || !token || !location || !area) {
      alert("กรุณากรอกจังหวัดและพื้นที่ (ต้องมากกว่า 0)");
      return;
    }

    const payload = {
      farm_id: parseInt(farmId),
      crop_type_id: farmData.crop_type_id,
      location: location,
      area_rai: parseFloat(area),
      quality: quality || "ปานกลาง",
      harvest_month: parseInt(month) || null,
      tree_age_avg: parseFloat(age) || null,
      calc_date: new Date().toISOString().split('T')[0]
    };

    try {
      const res = await fetch("http://localhost:4000/api/calculations/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "คำนวณไม่สำเร็จ");
      
      alert("คำนวณผลผลิตสำเร็จ! กำลังไปหน้าสรุปผล...");
      
      navigate(`/farm/${farmId}/summary`, { 
        state: { 
          calculationData: data,
          originalCalculation: originalCalculation
        } 
      }); 

    } catch (err) {
      alert(`คำนวณไม่สำเร็จ: ${err.message}`);
    }
  };

  // ( ... if (isLoading) ... เหมือนเดิม )
  if (isLoading) {
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

  // ------------------------------------
  // ⭐️ 2. (แก้ไข) JSX ของฟอร์ม
  // ------------------------------------
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        
        <form
          onSubmit={handlePreview} 
          className="bg-white shadow-md rounded-xl p-6 w-full max-w-lg md:max-w-xl"
        >
          {/* ( ... ส่วนหัวฟอร์ม ... เหมือนเดิม) */}
          <h1 className="text-green-800 font-bold text-xl mb-4 text-left">
            คำนวณผลผลิต
          </h1>
          <div className="mb-3 p-3 bg-green-50 rounded-lg">
            <p className="font-semibold">ฟาร์ม: {farmData?.name}</p>
            <p className="text-sm text-gray-600">พืช: {farmData?.crop_name}</p>
          </div>

          {/* ⭐️ (แก้ไข) Input จังหวัด (เพิ่ม datalist) */}
          <label className="block text-gray-700 mb-1">จังหวัด</label>
          <input
            type="text"
            list="province-list" // 👈 ระบุ datalist
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 mb-3"
            placeholder="พิมพ์เพื่อค้นหาจังหวัด..."
            required
          />
          {/* 👈 เพิ่ม datalist สำหรับ Autocomplete */}
          <datalist id="province-list">
            {thaiProvinces.map(prov => (
              <option key={prov} value={prov} />
            ))}
          </datalist>

          {/* (Input พื้นที่ ... เหมือนเดิม) */}
          <label className="block text-gray-700 mb-1">พื้นที่ (ไร่)</label>
          <input
            type="number"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 mb-3"
            placeholder="0.00"
            required
          />

          {/* (Input อายุต้น ... เหมือนเดิม) */}
          <label className="block text-gray-700 mb-1">อายุต้นเฉลี่ย (ปี)</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 mb-3"
            placeholder="เช่น 5 (ถ้าไม่ทราบ เว้นว่างได้)"
          />

          {/* (Select คุณภาพ ... เหมือนเดิม) */}
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

          {/* ⭐️ (แก้ไข) Input เดือน (เปลี่ยนเป็น Select) */}
          <label className="block text-gray-700 mb-1">เดือนเก็บเกี่ยว</label>
          <select
            value={month} // 👈 ค่าที่ state เก็บ (เช่น "11")
            onChange={(e) => setMonth(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 mb-4 bg-white"
          >
            <option value="">-- เลือกเดือน -- (ถ้าไม่ทราบ เว้นว่างได้)</option>
            {thaiMonths.map(m => (
              <option key={m.value} value={m.value}>
                {m.name} (เดือน {m.value})
              </option>
            ))}
          </select>
          
          {/* (ปุ่ม Submit ... เหมือนเดิม) */}
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