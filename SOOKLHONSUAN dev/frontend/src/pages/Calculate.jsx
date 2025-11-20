import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import AlertModal from "../components/AlertModal";

const thaiMonths = [
  { value: "1", name: "มกราคม" }, { value: "2", name: "กุมภาพันธ์" }, { value: "3", name: "มีนาคม" },
  { value: "4", name: "เมษายน" }, { value: "5", name: "พฤษภาคม" }, { value: "6", name: "มิถุนายน" },
  { value: "7", name: "กรกฎาคม" }, { value: "8", name: "สิงหาคม" }, { value: "9", name: "กันยายน" },
  { value: "10", name: "ตุลาคม" }, { value: "11", name: "พฤศจิกายน" }, { value: "12", name: "ธันวาคม" },
];

const thaiProvinces = [
  "เชียงใหม่", "เชียงราย", "ลำพูน", "ลำปาง", "พะเยา", "แพร่", "น่าน", "แม่ฮ่องสอน", "อุตรดิตถ์", // ภาคเหนือ
  // ... เพิ่มจังหวัดอื่นๆ ตามต้องการ
  "กรุงเทพมหานคร"
];

export default function Calculate() {
  const navigate = useNavigate();
  const { farmId } = useParams();
  const routeLocation = useLocation();
  
  // ⭐ รับข้อมูลที่ส่งกลับมาจากหน้า OCR (preloadData)
  const { preloadData, originalCalculation } = routeLocation.state || {};

  const [farmData, setFarmData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // ⭐ AutoFill: ถ้ามี preloadData ให้ใช้เลย ถ้าไม่มีให้เป็นค่าว่าง
  const [location, setLocation] = useState(preloadData?.location || "");
  const [area, setArea] = useState(preloadData?.area_rai?.toString() || "");
  const [quality, setQuality] = useState(preloadData?.quality || "");
  const [month, setMonth] = useState(preloadData?.harvest_month?.toString() || "");
  const [age, setAge] = useState(preloadData?.tree_age_avg?.toString() || "");

  const [modalState, setModalState] = useState({
    isOpen: false, type: 'success', title: '', message: '', onCloseAction: null
  });

  const handleModalClose = () => {
    const action = modalState.onCloseAction;
    setModalState({ isOpen: false, type: 'success', title: '', message: '', onCloseAction: null });
    if (action) action(); 
  };

  // ⭐ ฟังก์ชันสำหรับไปหน้า OCR
  const goToOCR = () => {
    navigate(`/farm/${farmId}/ocr`);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!farmId || farmId === "undefined") {
      setModalState({
        isOpen: true, type: 'error', title: 'ID ผิดพลาด', message: 'ไม่พบ ID ของฟาร์ม', onCloseAction: () => navigate("/dashboard")
      });
      return; 
    }

    const fetchFarmData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`http://localhost:4000/api/farms/${farmId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("ไม่พบข้อมูลฟาร์ม");
        const data = await res.json();
        setFarmData(data); 
      } catch (err) {
        setModalState({
          isOpen: true, type: 'error', title: 'เกิดข้อผิดพลาด', message: err.message, 
          onCloseAction: err.message.includes("not found") ? () => navigate("/dashboard") : null
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchFarmData();
  }, [farmId, navigate]); 

  const handlePreview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    if (!farmData || !token || !location || !area) {
      setModalState({
        isOpen: true, type: 'error', title: 'ข้อมูลไม่ครบถ้วน', message: 'กรุณากรอกจังหวัดและพื้นที่', onCloseAction: null 
      });
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
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "คำนวณไม่สำเร็จ");
      
      setModalState({
        isOpen: true, type: 'success', title: 'คำนวณสำเร็จ', message: 'กำลังไปหน้าสรุปผล...',
        onCloseAction: () => navigate(`/farm/${farmId}/summary`, { 
          state: { calculationData: data, originalCalculation: originalCalculation } 
        })
      });

    } catch (err) {
      setModalState({ isOpen: true, type: 'error', title: 'คำนวณไม่สำเร็จ', message: err.message, onCloseAction: null });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <motion.main className="flex-1 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p>กำลังโหลดข้อมูลฟาร์ม...</p>
        </motion.main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        
        <motion.form
          onSubmit={handlePreview} 
          className="bg-white shadow-md rounded-xl p-6 w-full max-w-lg md:max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* ⭐ ส่วนหัว: เพิ่มปุ่มสแกนภาพ */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
             <div>
                <h1 className="text-green-800 font-bold text-xl text-left">
                  คำนวณผลผลิต
                </h1>
                <p className="text-xs text-gray-500">ใช้ AI ช่วยกรอกข้อมูล หรือกรอกเอง</p>
             </div>
             
             <button
               type="button"
               onClick={goToOCR}
               className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
             >
               📸 สแกนภาพ
             </button>
          </div>

          <hr className="mb-4 border-gray-200"/>

          <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="font-semibold text-green-900">ฟาร์ม: {farmData?.name}</p>
            <p className="text-sm text-green-700">พืช: {farmData?.crop_name}</p>
          </div>

          <label className="block text-gray-700 mb-1 font-medium">จังหวัด</label>
          <input
            type="text"
            list="province-list"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3 focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="เช่น เชียงใหม่"
            required
          />
          <datalist id="province-list">
            {thaiProvinces.map(prov => <option key={prov} value={prov} />)}
          </datalist>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
                <label className="block text-gray-700 mb-1 font-medium">พื้นที่ (ไร่)</label>
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="0.00"
                  required
                />
            </div>
            <div>
                <label className="block text-gray-700 mb-1 font-medium">อายุต้น (ปี)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="ระบุอายุ"
                />
            </div>
          </div>

          <label className="block text-gray-700 mb-1 font-medium">คุณภาพการดูแล</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="">-- เลือกคุณภาพ (ค่าเริ่มต้น: ปานกลาง) --</option>
            <option value="ดีมาก">ดีมาก (ดูแลใส่ปุ๋ย/น้ำ ครบถ้วน)</option>
            <option value="ปานกลาง">ปานกลาง (ตามมาตรฐาน)</option>
            <option value="ต่ำ">ต่ำ (ดูแลน้อย/ธรรมชาติ)</option>
          </select>

          <label className="block text-gray-700 mb-1 font-medium">เดือนเก็บเกี่ยว</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="">-- เลือกเดือน (ถ้าไม่ระบุ ใช้ปัจจุบัน) --</option>
            {thaiMonths.map(m => (
              <option key={m.value} value={m.value}>{m.name}</option>
            ))}
          </select>
          
          <div className="flex flex-col items-center gap-3">
            <button
              type="submit"
              className="w-full bg-green-700 text-white px-8 py-3 rounded-full shadow-lg hover:bg-green-800 transition font-bold text-lg"
            >
              📊 คำนวณผลผลิต
            </button>
            
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full text-gray-600 font-semibold py-2 px-8 rounded-full hover:bg-gray-100 transition"
            >
              ยกเลิก
            </button>
          </div>

        </motion.form>
      </main>
      <Footer />
      
      <AlertModal 
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
      />
    </div>
  );
}