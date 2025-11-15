// FarmForm.jsx (ฉบับอัปเดต: Navbar + Animation + Modals)

import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
// import Header from "../components/Header"; // ❌ ลบ
import Navbar from "../components/Navbar"; // ✅ เพิ่ม
import Footer from "../components/Footer"; 
import { motion } from "framer-motion"; // ✅ เพิ่ม
import AlertModal from "../components/AlertModal"; // ✅ เพิ่ม

export default function FarmForm() {
  const navigate = useNavigate();
  const [farmName, setFarmName] = useState("");
  const [selectedCropId, setSelectedCropId] = useState(""); 
  const [cropTypesList, setCropTypesList] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  // ✅ 1. เพิ่ม State สำหรับ Modal (เหมือนหน้า Calculate)
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onCloseAction: null 
  });

  // ✅ 2. เพิ่มฟังก์ชันปิด Modal (เหมือนหน้า Calculate)
  const handleModalClose = () => {
    const action = modalState.onCloseAction;
    
    setModalState({ 
      isOpen: false, 
      type: 'success', 
      title: '', 
      message: '', 
      onCloseAction: null 
    });
    
    if (action) {
      action(); 
    }
  };

  // --- ( useEffect - ดึงข้อมูลพืชจาก API ) ---
  useEffect(() => {
    const fetchCropTypes = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/crop-types");
        
        if (!response.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูลชนิดพืชได้");
        }
        
        const data = await response.json();
        setCropTypesList(data);
        
      } catch (error) {
        console.error("Fetch crop types error:", error);
        
        // ❌ alert("เกิดข้อผิดพลาดในการโหลดข้อมูลพืช: " + error.message);
        // ✅ 3. เปลี่ยนเป็น Modal
        setModalState({
          isOpen: true,
          type: 'error',
          title: 'โหลดข้อมูลพืชไม่สำเร็จ',
          message: error.message + ", กรุณาลองใหม่อีกครั้ง",
          onCloseAction: () => navigate('/dashboard') // ถ้าโหลดพืชไม่ได้ ก็กลับ Dashboard
        });

      } finally {
        setIsLoading(false);
      }
    };

    fetchCropTypes();
  }, [navigate]); // ⭐️ (เพิ่ม navigate เข้าไปใน dependency array)

  
  // --- ( handleSubmit - ส่งข้อมูลไป Backend ) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!farmName || !selectedCropId) {
      // ❌ alert("กรุณากรอกชื่อสวนและเลือกพืช");
      // ✅ 3. เปลี่ยนเป็น Modal
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณากรอกชื่อสวนและเลือกพืช',
        onCloseAction: null
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      // ❌ alert("ไม่พบข้อมูลผู้ใช้, กรุณาเข้าสู่ระบบใหม่");
      // ❌ navigate("/login");
      // ✅ 3. เปลี่ยนเป็น Modal
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'ไม่พบผู้ใช้',
        message: 'ไม่พบข้อมูลผู้ใช้, กรุณาเข้าสู่ระบบใหม่',
        onCloseAction: () => navigate('/login')
      });
      return;
    }
    
    const payload = {
      name: farmName,
      crop_type_id: parseInt(selectedCropId)
    };

    try {
      const response = await fetch("http://localhost:4000/api/farms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json(); 

      if (!response.ok) {
        throw new Error(data.error || "มีบางอย่างผิดพลาด");
      }

      // ❌ alert("สร้างฟาร์มสำเร็จ! กำลังไปหน้าคำนวณผลผลิต...");
      // ❌ navigate(`/farm/${data.id}/calculate`);
      
      // ✅ 3. เปลี่ยนเป็น Modal
      setModalState({
        isOpen: true,
        type: 'success',
        title: 'สร้างฟาร์มสำเร็จ!',
        message: 'สร้างฟาร์มใหม่เรียบร้อย กำลังไปหน้าคำนวณผลผลิต...',
        onCloseAction: () => navigate(`/farm/${data.id}/calculate`)
      });

    } catch (error) {
      console.error("Create farm error:", error);
      // ❌ alert("เกิดข้อผิดพลาดในการสร้างฟาร์ม: " + error.message);
      // ✅ 3. เปลี่ยนเป็น Modal
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'สร้างฟาร์มไม่สำเร็จ',
        message: error.message,
        onCloseAction: null
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* <Header /> */}
      <Navbar /> {/* ✅ เปลี่ยนเป็น Navbar */}

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        
        {/* ✅ 4. เปลี่ยน <form> เป็น <motion.form> และเพิ่ม animation */}
        <motion.form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-xl p-6 w-full max-w-sm space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
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

          <select
            value={selectedCropId}
            onChange={(e) => setSelectedCropId(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
            disabled={isLoading}
          >
            <option value="">
              {isLoading ? "กำลังโหลดข้อมูลพืช..." : "-- เลือกพืช --"}
            </option>
            
            {cropTypesList.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-full shadow hover:bg-green-800"
            disabled={isLoading}
          >
            บันทึกสวน
          </button>
        </motion.form>
      </main>

      <Footer />

      {/* ✅ 5. เพิ่ม AlertModal ที่นี่ */}
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