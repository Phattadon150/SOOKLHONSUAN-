// Dashboard.jsx (ฉบับเต็ม - แก้ไขให้ส่งค่าไปหน้า History)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FarmCard from "../components/FarmCard"; 
import Modal from "../components/Modal"; 
import ConfirmModal from "../components/ConfirmModal"; 
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ⭐️ 1. กำหนด Key สำหรับ localStorage ของหน้า Dashboard
const LAST_DASHBOARD_FARM_KEY = "sook_lon_suan_last_dashboard_farm";

// ⭐️ (เพิ่มใหม่) 1B. Key สำหรับหน้า History (เพื่อให้หน้านี้ "ส่ง" ค่าไปได้)
const LAST_HISTORY_FARM_KEY = "sook_lon_suan_last_selected_farm";


export default function Dashboard() {
  const navigate = useNavigate();

  // ( ... State (ส่วนใหญ่) ... เหมือนเดิม )
  const [allCalculations, setAllCalculations] = useState([]); 
  const [allFarms, setAllFarms] = useState([]);
  const [displayedFarms, setDisplayedFarms] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', isError: false });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', farmId: null });

  // ( ... State กราฟ ... เหมือนเดิม )
  const [selectedFarmIdForGraph, setSelectedFarmIdForGraph] = useState(""); 
  const [graphData, setGraphData] = useState([]); 
  const [graphTitle, setGraphTitle] = useState("กรุณาคลิกเลือกสวนจากด้านล่างเพื่อแสดงข้อมูล"); 

  // --- (เพิ่ม) State สำหรับ Toggle กราฟ ---
  const [showActual, setShowActual] = useState(true);
  const [showEstimated, setShowEstimated] = useState(true);

  // ( ... useEffect (isVisible) ... เหมือนเดิม )
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ( ... useEffect (fetchDashboardData) ... )
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
        
        setAllCalculations(calcsData); 

        // --- (ประมวลผลสำหรับ "จัดกลุ่มฟาร์ม" ... เหมือนเดิม) ---
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

        // --- ⭐️ 2. ตรวจสอบการเลือกล่าสุดจาก localStorage ---
        try {
          const savedFarmId = localStorage.getItem(LAST_DASHBOARD_FARM_KEY);
          if (savedFarmId) {
            // ตรวจสอบว่า ID ที่บันทึกไว้ ยังมีอยู่ในลิสต์สวนหรือไม่
            const farmExists = groupedFarms.some(f => f.farm_id.toString() === savedFarmId);
            if (farmExists) {
              setSelectedFarmIdForGraph(savedFarmId); // 👈 กู้คืนการเลือก
            } else {
              localStorage.removeItem(LAST_DASHBOARD_FARM_KEY); // 👈 ล้างค่าเก่าทิ้งถ้าไม่เจอ
            }
          }
        } catch (e) {
          console.error("Failed to read saved farm ID from localStorage", e);
          localStorage.removeItem(LAST_DASHBOARD_FARM_KEY);
        }
        // --- ⭐️ (สิ้นสุดส่วนที่เพิ่ม) ---

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [navigate]);


  // ( ... useEffect (ประมวลผลกราฟ) ... เหมือนเดิม)
  useEffect(() => {
    if (!selectedFarmIdForGraph || allFarms.length === 0) {
      setGraphTitle("กรุณาคลิกเลือกสวนจากด้านล่างเพื่อแสดงข้อมูล");
      setGraphData([]);
      return;
    }

    const selectedFarm = allFarms.find(f => f.farm_id.toString() === selectedFarmIdForGraph);
    if (!selectedFarm) return; 

    const calcsForFarm = allCalculations
      .filter(c => c.farm_id.toString() === selectedFarmIdForGraph)
      .sort((a, b) => new Date(b.calc_date) - new Date(a.calc_date));

    if (calcsForFarm.length === 0) {
      setGraphTitle(`ยังไม่มีข้อมูลสำหรับสวน: ${selectedFarm.farm_name}`);
      setGraphData([]);
      return;
    }

    if (calcsForFarm.length === 1) {
      const latestCalc = calcsForFarm[0];
      const date1Str = new Date(latestCalc.calc_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

      setGraphTitle(`ข้อมูลล่าสุด (${date1Str}) - สวน: ${selectedFarm.farm_name}`);
      setGraphData([
        {
          name: date1Str,
          "ผลผลิตคาดการณ์": latestCalc.estimated_yield ?? 0,
          "ผลผลิตจริง": latestCalc.actual_yield ?? 0,
        }
      ]);
      return;
    }

    const latestCalc = calcsForFarm[0];
    const secondLatestCalc = calcsForFarm[1];
    
    const date1Str = new Date(latestCalc.calc_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    const date2Str = new Date(secondLatestCalc.calc_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

    setGraphTitle(`เปรียบเทียบ 2 ครั้งล่าสุด - สวน: ${selectedFarm.farm_name}`);
    setGraphData([
      {
        name: date1Str, 
        "ผลผลิตคาดการณ์": latestCalc.estimated_yield ?? 0,
        "ผลผลิตจริง": latestCalc.actual_yield ?? 0,
      },
      {
        name: date2Str, 
        "ผลผลิตคาดการณ์": secondLatestCalc.estimated_yield ?? 0,
        "ผลผลิตจริง": secondLatestCalc.actual_yield ?? 0,
      }
    ].reverse()); 
  }, [selectedFarmIdForGraph, allCalculations, allFarms]); 
  
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


  // ( ... ฟังก์ชัน handleDeleteFarm ... เหมือนเดิม)
  const handleDeleteFarm = (farmId, farmName) => {
    setConfirmModal({
      isOpen: true,
      title: `ยืนันการลบสวน`,
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบสวน "${farmName}"?\nประวัติการคำนวณทั้งหมดของสวนนี้จะถูกลบอย่างถาวร`,
      farmId: farmId
    });
  };
  
  // ( ... ฟังก์ชัน executeDelete ... )
  const executeDelete = async () => {
    const farmId = confirmModal.farmId;
    
    // --- ⭐️ 3. ลบออกจาก localStorage ถ้าสวนที่ถูกลบคือสวนที่เลือกไว้ ---
    if (farmId.toString() === selectedFarmIdForGraph) {
      setSelectedFarmIdForGraph("");
      localStorage.removeItem(LAST_DASHBOARD_FARM_KEY); // 👈 (เพิ่ม)
    }
    // --- ⭐️ (สิ้นสุดส่วนที่แก้ไข) ---

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

  // ( ... ฟังก์ชัน handleAddNewCalculation ... เหมือนเดิม)
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

  // ⭐️ (แก้ไขฟังก์ชันนี้) ⭐️
  const handleViewHistory = (farmId) => {
    // 1. ค้นหาข้อมูลฟาร์มทั้งหมดจาก allFarms
    const farmToSelect = allFarms.find(f => f.farm_id === farmId);
    
    if (farmToSelect) {
      try {
        // 2. บันทึกข้อมูลฟาร์มที่เลือก (แบบเดียวกับที่ History.jsx ทำ)
        // โดยใช้ Key ที่ตรงกับที่หน้า History.jsx ใช้
        localStorage.setItem(LAST_HISTORY_FARM_KEY, JSON.stringify(farmToSelect));
      } catch (e) {
        console.error("Failed to save farm to localStorage for history page", e);
      }
    }
    
    // 3. นำทางไปยังหน้าประวัติ
    navigate("/history");
  };
  // ⭐️ (สิ้นสุดการแก้ไข) ⭐️

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
        
        {/* --- (ส่วนกราฟ) --- */}
        <div 
          className={`bg-white shadow-md rounded-xl p-6 mb-8 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* (ส่วนหัวกราฟ) */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
            <h2 className="text-lg text-green-900 font-semibold">
              {graphTitle}
            </h2>
            {selectedFarmIdForGraph && (
              // --- ⭐️ 4. เพิ่มการลบออกจาก localStorage ที่ปุ่ม "ล้างการเลือก" ---
              <button
                onClick={() => {
                  setSelectedFarmIdForGraph("");
                  localStorage.removeItem(LAST_DASHBOARD_FARM_KEY); // 👈 (เพิ่ม)
                }}
                className="text-sm text-blue-600 hover:underline flex-shrink-0"
              >
                (ล้างการเลือก)
              </button>
            )}
          </div>

          {/* (ปุ่ม Toggles) */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowActual(!showActual)}
              className={`text-sm px-3 py-1 rounded-full border-2 ${
                showActual
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              ผลผลิตจริง
            </button>
            <button
              onClick={() => setShowEstimated(!showEstimated)}
              className={`text-sm px-3 py-1 rounded-full border-2 ${
                showEstimated
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              ผลผลิตคาดการณ์
            </button>
          </div>

          {/* (ส่วนแสดงกราฟ) */}
          <div className="h-72 w-full min-w-[300px] min-h-[200px]">
            {(isLoading && !selectedFarmIdForGraph) ? (
              <p className="text-center text-gray-500 pt-10">กำลังโหลดข้อมูล...</p>
            ) : !selectedFarmIdForGraph ? (
              <p className="text-center text-gray-500 pt-10">
                กรุณาคลิกเลือกสวนจากด้านล่างเพื่อแสดงข้อมูล
              </p>
            ) : graphData.length === 0 && graphTitle.includes("ยังไม่มีข้อมูล") ? (
                <p className="text-center text-gray-500 pt-10">
                  {graphTitle}
                </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={graphData} 
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                > 
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {showEstimated && (
                    <Bar dataKey="ผลผลิตคาดการณ์" fill="#ef4444" />
                  )}
                  {showActual && (
                    <Bar dataKey="ผลผลิตจริง" fill="#10b981" />
                  )}
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
        
        {/* --- ⭐️ Grid แสดง FarmCard (อัปเดต onClick ... เหมือนเดิม) --- */}
        {isLoading ? (
          <p>กำลังโหลดข้อมูลสวน...</p>
        ) : error ? (
          <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedFarms.length > 0 ? (
              displayedFarms.map((farm, index) => {
                const isSelected = farm.farm_id.toString() === selectedFarmIdForGraph;
                return (
                  // ⭐️ 5. แก้ไข onClick ที่ Wrapper นี้
                  <div 
                    key={farm.farm_id} 
                    onClick={() => {
                      const currentFarmId = farm.farm_id.toString();
                      if (selectedFarmIdForGraph === currentFarmId) {
                        setSelectedFarmIdForGraph(""); 
                        localStorage.removeItem(LAST_DASHBOARD_FARM_KEY); // 👈 (เพิ่ม)
                      } else {
                        setSelectedFarmIdForGraph(currentFarmId);
                        localStorage.setItem(LAST_DASHBOARD_FARM_KEY, currentFarmId); // 👈 (เพิ่ม)
                      }
                    }}
                    className={`transition-all duration-500 ease-out rounded-2xl cursor-pointer ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                    } ${
                      isSelected ? 'ring-4 ring-green-400' : 'ring-0 ring-transparent'
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
                );
              })
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