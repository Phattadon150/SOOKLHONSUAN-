// Summary.jsx (ฉบับแก้ไข: เปลี่ยน Alert เป็น Modal)

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; 
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import AlertModal from "../components/AlertModal"; // ✅ 1. Import AlertModal

// ( ... Helper function formatNum ... )
const formatNum = (num, digits = 0) => {
  const n = Number(num);
  if (!Number.isFinite(n) || n === 0) return digits === 0 ? "0" : "0.00"; 
  return n.toLocaleString("th-TH", { 
    minimumFractionDigits: digits, 
    maximumFractionDigits: digits 
  });
};

export default function Summary() {
  const navigate = useNavigate();
  
  // 1. รับข้อมูลทั้ง 2 ส่วนจาก location.state
  const location = useLocation(); 
  const { calculationData, originalCalculation } = location.state || {};
  
  const [isSaving, setIsSaving] = useState(false);
  
  // ( ... State สำหรับโหมด "บันทึกผลผลิตจริง" ... )
  const [actualYield, setActualYield] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [diff, setDiff] = useState({ value: 0, percent: 0 });

  // ✅ 2. เพิ่ม State สำหรับ Modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'success', // 'success' หรือ 'error'
    title: '',
    message: ''
  });

  // ✅ 3. สร้างฟังก์ชันปิด Modal (และจัดการ Navigate)
  const handleModalClose = () => {
    const wasSuccess = modalState.type === 'success';
    
    // ปิด Modal
    setModalState({ isOpen: false, type: 'success', title: '', message: '' });
    
    // ⭐️ สำคัญ: ถ้่Modal ที่เพิ่งปิดเป็น 'success' ให้ Navigate กลับ
    // เราย้าย navigate() มาไว้ตรงนี้ เพราะเราอยากให้มันทำงาน "หลังจาก" ที่ผู้ใช้กดยืนยันใน Modal
    if (wasSuccess) {
      navigate("/dashboard");
    }
  };


  // 2. ( ... โค้ดเช็ค ถ้าไม่มี calculationData ... )
  if (!calculationData) {
    return (
      <div className="flex flex-col min-h-screen bg-stone-50">
        <Navbar />
        <motion.main 
          className="flex-1 flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-red-500">ไม่พบข้อมูลการคำนวณ</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="underline"
          >
            กลับไปหน้า Dashboard
          </button>
        </motion.main>
        <Footer />
        
        {/* ✅ 5. วาง Modal (สำหรับ Path นี้ด้วย) */}
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

  // ( ... ส่วนตรรกะ, state, functions ... )
  // 3. ( ... ตรรกะแยกแยะโหมดการทำงาน ... )
  const isPreview = calculationData.preview; 
  const isComparisonMode = isPreview && !!originalCalculation;
  const inputs = calculationData.input;
  const results = calculationData.result;
  
  let previousYield = 0;
  let existingCalcId = null;
  if (!isPreview) {
      previousYield = results.estimated_yield;
      existingCalcId = results.id;
  }

  // 4. (โค้ดเดิม) ฟังก์ชันสำหรับโหมด "สร้างใหม่" (POST)
  const handleSaveNew = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem("token");
    if (!token) {
        navigate('/login');
        return;
    }
    const payload = {
      ...inputs,
      estimated_yield: results.estimated_yield 
    };
    try {
      const res = await fetch("http://localhost:4000/api/calculations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      
      // ✅ 4. เปลี่ยนมาใช้ setModalState
      setModalState({
        isOpen: true,
        type: 'success',
        title: 'บันทึกสำเร็จ',
        message: 'บันทึกข้อมูลการคำนวณใหม่เรียบร้อยแล้ว'
      });

    } catch (err) {
      // ✅ 4. เปลี่ยนมาใช้ setModalState
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'บันทึกไม่สำเร็จ',
        message: err.message
      });
      setIsSaving(false);
    }
  };

  // 5. (ใหม่) ฟังก์ชันสำหรับโหมด "อัปเดตการคำนวณ" (PUT)
  const handleUpdateExisting = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem("token");
    if (!token) {
        navigate('/login');
        return;
    }
    
    const updateId = originalCalculation.id; 
    
    const payload = {
      ...inputs, // 👈 ข้อมูล input ใหม่ (จากหน้า Calculate)
      estimated_yield: results.estimated_yield // 👈 ผลลัพธ์ estimate ใหม่
    };

    try {
      const res = await fetch(`http://localhost:4000/api/calculations/${updateId}`, {
        method: "PUT", 
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปเดตไม่สำเร็จ");
      
      // ✅ 4. เปลี่ยนมาใช้ setModalState
      setModalState({
        isOpen: true,
        type: 'success',
        title: 'อัปเดตสำเร็จ',
        message: 'อัปเดตข้อมูลการคำนวณเรียบร้อยแล้ว'
      });

    } catch (err) {
      // ✅ 4. เปลี่ยนมาใช้ setModalState
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'อัปเดตไม่สำเร็จ',
        message: err.message
      });
      setIsSaving(false);
    }
  };


  // 6. (โค้ดเดิม) ฟังก์ชันสำหรับโหมด "บันทึกผลผลิตจริง" (PUT)
  const handleUpdateActual = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem("token");
    if (!token) {
        navigate('/login');
        return;
    }
    const payload = {
      actual_yield: Number(actualYield),
      calc_date: recordDate
    };
    try {
      const res = await fetch(`http://localhost:4000/api/calculations/${existingCalcId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      
      // ✅ 4. เปลี่ยนมาใช้ setModalState
      setModalState({
        isOpen: true,
        type: 'success',
        title: 'บันทึกผลผลิตจริงสำเร็จ',
        message: 'บันทึกข้อมูลผลผลิตจริงเรียบร้อยแล้ว'
      });

    } catch (err) {
      // ✅ 4. เปลี่ยนมาใช้ setModalState
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'บันทึกไม่สำเร็จ',
        message: err.message
      });
      setIsSaving(false);
    }
  };

  // 7. (โค้ดเดิม) ฟังก์ชันคำนวณ "ส่วนต่าง" (สำหรับโหมด 2)
  const calculateDifference = (newActual) => {
    const newYield = Number(newActual) || 0;
    setActualYield(newActual); 
    const oldYield = Number(previousYield) || 0;
    if (oldYield === 0 && newYield === 0) {
        setDiff({ value: 0, percent: 0 });
        return;
    }
    const valueDiff = newYield - oldYield;
    const percentDiff = (oldYield === 0) ? 100 : (valueDiff / oldYield) * 100;
    setDiff({ value: valueDiff, percent: percentDiff });
  };
  
  // 8. (โค้ดเดิม) useEffect สำหรับโหมด 2 (บันทึกผลจริง)
  useEffect(() => {
    if (!isPreview && results.actual_yield != null) {
      calculateDifference(results.actual_yield.toString());
      if (results.calc_date) {
        setRecordDate(new Date(results.calc_date).toISOString().split('T')[0]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreview, results.actual_yield, results.calc_date]);


  // -----------------------------------------------------------------
  //   RENDER: โหมดที่ 1 - "ยืนยันการคำนวณใหม่" (POST / PUT)
  // -----------------------------------------------------------------
  if (isPreview) {
    
    // ( ... ตรรกะคำนวณ comparisonData ... )
    let comparisonData = null;
    if (isComparisonMode) {
        const newEst = Number(results.estimated_yield) || 0;
        const oldEst = Number(originalCalculation.estimated_yield) || 0;
        const valueDiff = newEst - oldEst;
        const percentDiff = (oldEst === 0 && newEst > 0) ? 100 : (oldEst === 0 ? 0 : (valueDiff / oldEst) * 100);
        comparisonData = {
            new: newEst,
            old: oldEst,
            diff: valueDiff,
            percent: percentDiff,
            color: valueDiff > 0 ? 'green' : (valueDiff < 0 ? 'red' : 'gray')
        };
    }

    return (
      <div className="flex flex-col min-h-screen bg-stone-50">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          
          <motion.form 
            onSubmit={isComparisonMode ? handleUpdateExisting : handleSaveNew} 
            className="w-full max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-green-900 mb-2 text-center">
              สรุปผลการคำนวณ
            </h1>
            <p className="text-lg text-gray-600 mb-8 text-center">
              {isComparisonMode 
                ? "เปรียบเทียบผลลัพธ์ใหม่กับผลลัพธ์เดิม" 
                : "กรุณาตรวจสอบข้อมูลและกดยืนยันเพื่อบันทึก"}
            </p>

            {isComparisonMode ? (
              <>
                {/* --- RENDER COMPARISON --- */}
                <div className="bg-white shadow-xl rounded-2xl p-6 mb-4">
                  <p className="text-gray-700 text-lg">ผลผลิตรอบนี้ (คำนวณใหม่)</p>
                  <p className="text-green-800 text-5xl font-bold my-2">
                    {formatNum(comparisonData.new, 0)}
                  </p>
                  <p className="text-gray-700 text-lg">กก.</p>
                </div>
                <div className="bg-white shadow-xl rounded-2xl p-6 mb-4">
                  <p className="text-gray-700 text-lg">ผลผลิตรอบก่อนหน้า (ที่คาดการณ์)</p>
                  <p className="text-gray-900 text-3xl font-bold my-2">
                    {formatNum(comparisonData.old, 0)} กก.
                  </p>
                </div>
                <div className={`shadow-xl rounded-2xl p-6 mb-8 text-left ${comparisonData.color === 'gray' ? 'bg-gray-50' : (comparisonData.color === 'green' ? 'bg-green-100' : 'bg-red-100')}`}>
                  <p className="text-gray-700 text-lg">ส่วนต่าง</p>
                  <p className={`text-3xl font-bold my-2 ${comparisonData.color === 'gray' ? 'text-gray-800' : (comparisonData.color === 'green' ? 'text-green-700' : 'text-red-700')}`}>
                    {formatNum(comparisonData.diff, 0)} กก.
                  </p>
                  <p className={`font-semibold ${comparisonData.color === 'gray' ? 'text-gray-600' : (comparisonData.color === 'green' ? 'text-green-600' : 'text-red-600')}`}>
                    ({comparisonData.percent > 0 ? '+' : ''}{formatNum(comparisonData.percent, 2)}%)
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* --- RENDER ORIGINAL (Simple) --- */}
                <div className="bg-white shadow-xl rounded-2xl p-6 mb-6 text-center">
                  <p className="text-gray-700 text-lg">ผลผลิตที่คาดว่าจะได้</p>
                  <p className="text-green-800 text-5xl font-bold my-2">
                    {formatNum(results.estimated_yield, 0)}
                  </p>
                  <p className="text-gray-700 text-lg">กก.</p>
                </div>
              </>
            )}

            <div className="bg-white shadow-xl rounded-2xl p-6 mb-8 text-left space-y-2">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">
                ข้อมูลที่ใช้ (รอบใหม่นี้)
              </h3>
              <p><strong>จังหวัด:</strong> {inputs.location}</p>
              <p><strong>พื้นที่:</strong> {formatNum(inputs.area_rai, 2)} ไร่</p>
              <p><strong>คุณภาพ:</strong> {inputs.quality}</p>
              <p><strong>อายุต้น:</strong> {formatNum(inputs.tree_age_avg, 1)} ปี</p>
              <p><strong>เดือนเก็บเกี่ยว:</strong> {formatNum(inputs.harvest_month)}</p>
              <hr className="my-2"/>
              <p className="text-sm text-gray-500">
                ค่าเฉลี่ยจังหวัด: {formatNum(results.baseline_avg_per_rai, 0)} กก./ไร่
              </p>
              <p className="text-sm text-gray-500">
                Factor ฤดูกาล: {formatNum(results.season_factor, 2)}
              </p>
            </div>

            <div className="mt-4 text-center flex flex-col items-center">
              <button
                type="submit"
                className="w-full max-w-xs bg-green-700 text-white font-bold py-3 px-10 rounded-full text-lg shadow-md hover:bg-green-800 transition disabled:bg-gray-400"
                disabled={isSaving}
              >
                {isSaving ? "กำลังบันทึก..." : (isComparisonMode ? "อัปเดตการคำนวณ" : "ยืนยันการบันทึก")}
              </button>
              
              <button
                type="button"
                onClick={() => navigate(-1)} 
                className="w-full max-w-xs mt-3 font-bold py-3 px-10 rounded-full text-lg border border-gray-400 text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
                disabled={isSaving}
              >
                ยกเลิก (กลับไปแก้ไข)
              </button>
            </div>
            
          </motion.form> 
        </main>
        <Footer />
        
        {/* ✅ 5. วาง Modal (สำหรับ Path นี้) */}
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

  // -----------------------------------------------------------------
  //   RENDER: โหมดที่ 2 - "บันทึกผลผลิตจริง" (PUT)
  // -----------------------------------------------------------------
  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        
        <motion.form 
          onSubmit={handleUpdateActual} 
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-green-900 mb-2 text-center">
            สรุปผลและบันทึกผล
          </h1>
          <p className="text-lg text-gray-600 mb-8 text-center">
            เปรียบเทียบผลผลิตจริงกับที่คาดการณ์ไว้
          </p>
          {/* Card 1: ผลผลิตรอบนี้ (Input) */}
          <div className="bg-white shadow-xl rounded-2xl p-6 mb-4">
            <label htmlFor="actual_yield" className="text-gray-700 text-lg font-semibold">
              ผลผลิตรอบนี้ (กก.)
            </label>
            <input
              type="number"
              step="any"
              id="actual_yield"
              value={actualYield}
              onChange={(e) => calculateDifference(e.target.value)}
              className="w-full text-green-800 text-4xl font-bold my-2 p-2 border-b-2 border-gray-300 focus:border-green-600 outline-none"
              placeholder="0.00"
              required
            />
          </div>
          {/* Card 2: ผลผลิตรอบก่อนหน้า (ข้อมูลเก่า) */}
          <div className="bg-white shadow-xl rounded-2xl p-6 mb-4 text-left">
            <p className="text-gray-700 text-lg">ผลผลิตรอบก่อนหน้า (ที่คาดการณ์)</p>
            <p className="text-gray-900 text-3xl font-bold my-2">
              {formatNum(previousYield, 2)} กก.
            </p>
          </div>
          {/* Card 3: ส่วนต่าง (คำนวณอัตโนมัติ) */}
          <div className={`shadow-xl rounded-2xl p-6 mb-8 text-left ${diff.value === 0 ? 'bg-gray-50' : (diff.value > 0 ? 'bg-green-100' : 'bg-red-100')}`}>
            <p className="text-gray-700 text-lg">ส่วนต่าง</p>
            <p className={`text-3xl font-bold my-2 ${diff.value === 0 ? 'text-gray-800' : (diff.value > 0 ? 'text-green-700' : 'text-red-700')}`}>
              {formatNum(diff.value, 2)} กก.
            </p>
            <p className={`font-semibold ${diff.value === 0 ? 'text-gray-600' : (diff.value > 0 ? 'text-green-600' : 'text-red-600')}`}>
              ({diff.percent > 0 ? '+' : ''}{formatNum(diff.percent, 2)}%)
            </p>
          </div>
          {/* Card 4: วันที่บันทึก */}
          <div className="bg-white shadow-xl rounded-2xl p-6 mb-8 text-left">
             <label htmlFor="record_date" className="text-gray-700 text-lg">
               วันที่บันทึกข้อมูล
             </label>
             <input 
               type="date"
               id="record_date"
               value={recordDate}
               onChange={(e) => setRecordDate(e.target.value)}
               className="w-full text-gray-800 text-xl font-semibold mt-2 p-2 border rounded-md"
               required
             />
             <p className="text-sm text-gray-500 mt-1">
               (วันที่เก็บผลผลิตจริง หรือวันที่บันทึก)
             </p>
          </div>
          {/* ปุ่ม */}
          <div className="mt-4 text-center flex flex-col items-center">
            <button
              type="submit"
              className="w-full max-w-xs bg-green-700 text-white font-bold py-3 px-10 rounded-full text-lg shadow-md hover:bg-green-800 transition disabled:bg-gray-400"
              disabled={isSaving || !actualYield}
            >
              {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)} 
              className="w-full max-w-xs mt-3 font-bold py-3 px-10 rounded-full text-lg border border-gray-400 text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
              disabled={isSaving}
            >
              ยกเลิก
            </button>
          </div>
          
        </motion.form>
      </main>
      <Footer />
      
      {/* ✅ 5. วาง Modal (สำหรับ Path นี้ด้วย) */}
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