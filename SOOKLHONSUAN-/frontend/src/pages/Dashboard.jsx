// Dashboard.jsx (ฉบับแก้ไข - กราฟรวมตามชนิดพืช)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FarmCard from "../components/FarmCard"; 
import Modal from "../components/Modal"; 
import ConfirmModal from "../components/ConfirmModal"; 
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell // ⭐️ 1. (แก้ไข) Import "Cell" เพิ่ม
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();

  // ( ... State ทั้งหมด ... เหมือนเดิม )
  const [allCalculations, setAllCalculations] = useState([]); 
  const [allFarms, setAllFarms] = useState([]);
  const [displayedFarms, setDisplayedFarms] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [graphData, setGraphData] = useState([]);
  // const [cropNames, setCropNames] = useState([]); // (ไม่จำเป็นต้องใช้แล้ว)
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', isError: false });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', farmId: null });

  const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f97316", "#8b5cf6", "#ec4899"];
  const getColor = (index) => COLORS[index % COLORS.length];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    
    const fetchDashboardData = async () => {
      try {
        const headers = { "Authorization": `Bearer ${token}` };
        const calcsRes = await fetch("http://localhost:4000/api/calculations", { headers });

        if (!calcsRes.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลการคำนวณได้");
        }
        
        let calcsData = await calcsRes.json();
        calcsData = calcsData.filter(calc => calc && calc.farm_id);
        
        setAllCalculations(calcsData); // 👈 (A) เก็บข้อมูลดิบ

        // --- ⭐️ (B) (แก้ไข) ประมวลผลสำหรับ "กราฟรวมตามชนิดพืช" ---
        const cropYieldMap = new Map();

        for (const calc of calcsData) {
          // เราจะนับเฉพาะ "ผลผลิตจริง" (actual_yield)
          if (calc.crop_name && calc.actual_yield != null && calc.actual_yield > 0) {
            
            const cropName = calc.crop_name;
            const yieldAmount = calc.actual_yield;

            // ถ้ายังไม่เคยเจอพืชนี้ ให้ set ค่าเริ่มต้น
            if (!cropYieldMap.has(cropName)) {
              cropYieldMap.set(cropName, 0);
            }
            // รวมยอด
            cropYieldMap.set(cropName, cropYieldMap.get(cropName) + yieldAmount);
          }
        }
        
        // แปลง Map เป็น Array ที่ Recharts ใช้ได้ (และเรียงจากมากไปน้อย)
        const newGraphData = Array.from(cropYieldMap.entries())
          .map(([name, yieldValue]) => ({
            name: name, // (เช่น "ลำไย", "มะม่วง")
            "ผลผลิตจริง": yieldValue // (เช่น 50000, 25000)
          }))
          .sort((a, b) => b["ผลผลิตจริง"] - a["ผลผลิตจริง"]); // 👈 เรียงลำดับ

        setGraphData(newGraphData);
        // setCropNames(Array.from(allCropNames)); // (ไม่จำเป็นต้องใช้แล้ว)

        // --- (C) ประมวลผลสำหรับ "จัดกลุ่มฟาร์ม" (เหมือนเดิม) ---
        const farmMap = new Map();
        for (const calc of calcsData) {
          if (!farmMap.has(calc.farm_id)) {
            farmMap.set(calc.farm_id, {
              farm_id: calc.farm_id,
              farm_name: calc.farm_name,
              location: calc.location,
              crop_name: calc.crop_name,
              calculation_count: 0,
              latest_calc_date: new Date(0),
            });
          }
          const farmData = farmMap.get(calc.farm_id);
          farmData.calculation_count++;
          if (new Date(calc.calc_date) > farmData.latest_calc_date) {
            farmData.latest_calc_date = new Date(calc.calc_date);
          }
        }
        const groupedFarms = Array.from(farmMap.values());
        setAllFarms(groupedFarms);
        setDisplayedFarms(groupedFarms);

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [navigate]);

  
  // ( ... useEffect (ค้นหาฟาร์ม) ... เหมือนเดิม)
  useEffect(() => {
    if (!searchTerm) {
      setDisplayedFarms(allFarms);
      return;
    }
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = allFarms.filter(farm => 
      farm.farm_name.toLowerCase().includes(lowerSearch) ||
      (farm.location && farm.location.toLowerCase().includes(lowerSearch))
    );
    setDisplayedFarms(filtered);
  }, [searchTerm, allFarms]);


  // ( ... ฟังก์ชัน handleDeleteFarm, executeDelete ... เหมือนเดิม)
  const handleDeleteFarm = (farmId, farmName) => {
    setConfirmModal({
      isOpen: true,
      title: `ยืนันการลบสวน`,
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบสวน "${farmName}"?\nประวัติการคำนวณทั้งหมดของสวนนี้จะถูกลบอย่างถาวร`,
      farmId: farmId
    });
  };
  
  const executeDelete = async () => {
    const farmId = confirmModal.farmId;
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    try {
      const res = await fetch(`http://localhost:4000/api/farms/${farmId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ลบไม่สำเร็จ");
      }
      setAllFarms(currentFarms => 
        currentFarms.filter(farm => farm.farm_id !== farmId)
      );
      setAllCalculations(currentCalcs => 
        currentCalcs.filter(calc => calc.farm_id !== farmId)
      );
      setModal({ isOpen: true, title: "ลบสำเร็จ", message: `สวนของคุณถูกลบเรียบร้อยแล้ว`, isError: false });
    } catch (err) {
      setModal({ isOpen: true, title: "เกิดข้อผิดพลาด", message: err.message, isError: true });
    } finally {
      setConfirmModal({ isOpen: false, title: '', message: '', farmId: null });
    }
  };

  // ( ... ฟังก์ชัน handleAddNewCalculation, handleViewHistory ... เหมือนเดิม)
  const handleAddNewCalculation = (farmId) => {
    const latestCalc = allCalculations
      .filter(c => c.farm_id === farmId)
      .sort((a, b) => new Date(b.calc_date) - new Date(a.calc_date))[0];
    let preloadData = {};
    if (latestCalc) {
      preloadData = {
        location: latestCalc.location,
        area_rai: latestCalc.area_rai,
        quality: latestCalc.quality,
        harvest_month: latestCalc.harvest_month,
        tree_age_avg: latestCalc.tree_age_avg,
      };
    }
    navigate(`/farm/${farmId}/calculate`, {
      state: { preloadData }
    });
  };
  const handleViewHistory = (farmId) => { navigate("/history"); };
  const handleCloseModal = () => setModal({ ...modal, isOpen: false });
  const handleCloseConfirmModal = () => setConfirmModal({ ...confirmModal, isOpen: false });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar /> 
      
      {/* ( ... Popups ... เหมือนเดิม) */}
      <Modal 
        isOpen={modal.isOpen}
        onClose={handleCloseModal}
        title={modal.title}
        message={modal.message}
        isError={modal.isError}
      />
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={executeDelete}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full"> 
        
        {/* --- ⭐️ (แก้ไข) ส่วนกราฟ (UI และ Logic ใหม่) --- */}
        <div 
          className={`bg-white shadow-md rounded-xl p-6 mb-8 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* ⭐️ (แก้ไข) 3.1 เปลี่ยน Title */}
          <h2 className="text-center text-green-900 font-semibold mb-3">
            สรุปผลผลิตจริง (รวมตามชนิดพืช)
          </h2>
          <div className="h-72 w-full min-w-[300px] min-h-[200px]">
            {isLoading ? <p>Loading graph...</p> : (
              // ⭐️ (แก้ไข) 3.2 เปลี่ยน JSX ของกราฟ
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={graphData} // 👈 (ข้อมูลใหม่ เช่น [{ name: 'ลำไย', 'ผลผลิตจริง': 5000 }])
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                > 
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ผลผลิตจริง">
                    {/* ⭐️ นี่คือส่วนที่ทำให้แต่ละแท่งมีสีต่างกัน
                      (ตามที่คุณขอว่า ลำไย สีหนึ่ง, มะม่วง อีกสีหนึ่ง)
                    */}
                    {graphData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* --- (UI ส่วนจัดการสวน ... เหมือนเดิม) --- */}
        <div 
          className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          <h2 className="text-2xl font-bold text-green-900">
            สวนของคุณ
          </h2>
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อสวน หรือ จังหวัด..."
              className="w-full md:w-72 border border-gray-300 rounded-full px-5 py-2 text-base"
            />
            <button
              onClick={() => navigate("/farmform")}
              className="bg-green-700 text-white px-5 py-2 rounded-full shadow-md hover:bg-green-800 transition whitespace-nowrap"
            >
              + เพิ่มสวนใหม่
            </button>
          </div>
        </div>
        
        {/* --- (Grid แสดง FarmCard ... เหมือนเดิม) --- */}
        {isLoading ? (
          <p>กำลังโหลดข้อมูลสวน...</p>
        ) : error ? (
          <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedFarms.length > 0 ? (
              displayedFarms.map((farm, index) => (
                <div 
                  key={farm.farm_id} 
                  className={`transition-all duration-500 ease-out ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <FarmCard 
                    farm={farm}
                    onAddNew={() => handleAddNewCalculation(farm.farm_id)}
                    onViewHistory={() => handleViewHistory(farm.farm_id)}
                    onDeleteFarm={() => handleDeleteFarm(farm.farm_id, farm.farm_name)}
                  />
                </div>
              ))
            ) : (
              <p className="text-gray-500 md:col-span-2 lg:col-span-3 text-center py-10">
                {searchTerm ? 'ไม่พบสวนที่ค้นหา' : 'คุณยังไม่มีสวน (กด "เพิ่มสวนใหม่" เพื่อเริ่มต้น)'}
              </p> 
            )}
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}