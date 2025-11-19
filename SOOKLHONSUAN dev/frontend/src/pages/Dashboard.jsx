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

// ใช้ Key เดิมแต่เก็บเป็น Array แทน
const LAST_DASHBOARD_FARM_KEY = "sook_lon_suan_last_dashboard_farm_ids"; 
const LAST_HISTORY_FARM_KEY = "sook_lon_suan_last_selected_farm";

export default function Dashboard() {
  const navigate = useNavigate();

  // State
  const [allCalculations, setAllCalculations] = useState([]); 
  const [allFarms, setAllFarms] = useState([]);
  const [displayedFarms, setDisplayedFarms] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', isError: false });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', farmId: null });

  // ⭐️ State ใหม่: เก็บเป็น Array [] เพื่อรองรับหลายสวน
  const [selectedFarmIds, setSelectedFarmIds] = useState([]); 
  const [graphData, setGraphData] = useState([]); 
  const [graphTitle, setGraphTitle] = useState("กำลังประมวลผล...");

  const [showActual, setShowActual] = useState(true);
  const [showEstimated, setShowEstimated] = useState(true);

  // Animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch Data
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

        if (!calcsRes.ok) throw new Error("ไม่สามารถดึงข้อมูลการคำนวณได้");
        
        let calcsData = await calcsRes.json();
        calcsData = calcsData.filter(calc => calc && calc.farm_id);
        setAllCalculations(calcsData); 

        // Group Farms
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

        // ⭐️ Load Selection from LocalStorage (รองรับ Array)
        try {
          const saved = localStorage.getItem(LAST_DASHBOARD_FARM_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            // ตรวจสอบว่าเป็น Array และ ID ยังมีตัวตนอยู่จริง
            if (Array.isArray(parsed)) {
               const validIds = parsed.filter(id => groupedFarms.some(f => f.farm_id.toString() === id));
               setSelectedFarmIds(validIds);
            }
          }
        } catch (e) {
          console.error("Failed to load saved farms", e);
          localStorage.removeItem(LAST_DASHBOARD_FARM_KEY);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [navigate]);


  // ⭐️⭐️⭐️ Logic คำนวณกราฟ (Multi-mode) ⭐️⭐️⭐️
  useEffect(() => {
    if (isLoading) return;
    if (allFarms.length === 0) {
      setGraphTitle("ยังไม่มีข้อมูลสวน (กด 'เพิ่มสวนใหม่' เพื่อเริ่มต้น)");
      setGraphData([]);
      return;
    }

    // -------------------------------------------------
    // CASE 1: ไม่เลือกเลย -> แสดงผลรวม (Total Summary)
    // -------------------------------------------------
    if (selectedFarmIds.length === 0) {
      let totalEstimated = 0;
      let totalActual = 0;
      let hasData = false;

      allFarms.forEach(farm => {
        const farmCalcs = allCalculations
          .filter(c => c.farm_id === farm.farm_id)
          .sort((a, b) => new Date(b.calc_date) - new Date(a.calc_date));

        if (farmCalcs.length > 0) {
          totalEstimated += Number(farmCalcs[0].estimated_yield || 0);
          totalActual += Number(farmCalcs[0].actual_yield || 0);
          hasData = true;
        }
      });

      if (hasData) {
        setGraphTitle(`ภาพรวมผลผลิตทุกสวน (รวมข้อมูลล่าสุด)`);
        setGraphData([{
            name: "รวมทุกสวน",
            "ผลผลิตคาดการณ์": totalEstimated,
            "ผลผลิตจริง": totalActual,
        }]);
      } else {
        setGraphTitle("ยังไม่มีประวัติการคำนวณในระบบ");
        setGraphData([]);
      }
      return;
    }

    // -------------------------------------------------
    // CASE 2: เลือก 1 สวน -> แสดงประวัติ (History Comparison)
    // -------------------------------------------------
    if (selectedFarmIds.length === 1) {
      const farmId = selectedFarmIds[0];
      const selectedFarm = allFarms.find(f => f.farm_id.toString() === farmId);
      if (!selectedFarm) return;

      const calcsForFarm = allCalculations
        .filter(c => c.farm_id.toString() === farmId)
        .sort((a, b) => new Date(b.calc_date) - new Date(a.calc_date));

      if (calcsForFarm.length === 0) {
        setGraphTitle(`สวน: ${selectedFarm.farm_name} (ยังไม่มีข้อมูล)`);
        setGraphData([]);
        return;
      }

      // ดึง 2 ครั้งล่าสุดมาเทียบกัน
      const data = calcsForFarm.slice(0, 2).map(c => ({
         name: new Date(c.calc_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
         "ผลผลิตคาดการณ์": c.estimated_yield || 0,
         "ผลผลิตจริง": c.actual_yield || 0
      })).reverse(); // เรียงจากเก่าไปใหม่ (ซ้ายไปขวา)

      setGraphTitle(`ประวัติล่าสุด - สวน: ${selectedFarm.farm_name}`);
      setGraphData(data);
      return;
    }

    // -------------------------------------------------
    // CASE 3: เลือกหลายสวน -> เปรียบเทียบสวน (Farm Comparison)
    // -------------------------------------------------
    if (selectedFarmIds.length > 1) {
      const data = [];
      let names = [];

      selectedFarmIds.forEach(id => {
         const farm = allFarms.find(f => f.farm_id.toString() === id);
         if (farm) {
            // หาข้อมูลล่าสุดของสวนนั้น
            const calcs = allCalculations
                .filter(c => c.farm_id.toString() === id)
                .sort((a, b) => new Date(b.calc_date) - new Date(a.calc_date));
            
            if (calcs.length > 0) {
                const latest = calcs[0];
                data.push({
                    name: farm.farm_name, // แกน X เป็นชื่อสวน
                    "ผลผลิตคาดการณ์": latest.estimated_yield || 0,
                    "ผลผลิตจริง": latest.actual_yield || 0
                });
            } else {
                // กรณีเลือกสวนที่ไม่มีข้อมูล
                data.push({
                    name: farm.farm_name,
                    "ผลผลิตคาดการณ์": 0,
                    "ผลผลิตจริง": 0
                });
            }
            names.push(farm.farm_name);
         }
      });

      setGraphTitle(`เปรียบเทียบ ${selectedFarmIds.length} สวน: ${names.join(', ')}`);
      setGraphData(data);
    }

  }, [selectedFarmIds, allCalculations, allFarms, isLoading]); 

  // Search Logic
  useEffect(() => {
    if (!searchTerm) { setDisplayedFarms(allFarms); return; }
    const lower = searchTerm.toLowerCase();
    setDisplayedFarms(allFarms.filter(f => f.farm_name.toLowerCase().includes(lower)));
  }, [searchTerm, allFarms]);

  // Delete Logic
  const handleDeleteFarm = (farmId, farmName) => {
    setConfirmModal({ isOpen: true, title: `ยืนันการลบสวน`, message: `คุณแน่ใจหรือไม่ว่าต้องการลบสวน "${farmName}"?`, farmId });
  };
  
  const executeDelete = async () => {
    const farmId = confirmModal.farmId;
    // ถ้าลบสวนที่เลือกอยู่ ให้เอาออกจาก selection
    if (selectedFarmIds.includes(farmId.toString())) {
       const newSelection = selectedFarmIds.filter(id => id !== farmId.toString());
       setSelectedFarmIds(newSelection);
       localStorage.setItem(LAST_DASHBOARD_FARM_KEY, JSON.stringify(newSelection));
    }

    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    try {
      await fetch(`http://localhost:4000/api/farms/${farmId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setAllFarms(prev => prev.filter(f => f.farm_id !== farmId));
      setAllCalculations(prev => prev.filter(c => c.farm_id !== farmId));
      setModal({ isOpen: true, title: "ลบสำเร็จ", message: "ลบสวนเรียบร้อยแล้ว", isError: false });
    } catch (err) {
      setModal({ isOpen: true, title: "เกิดข้อผิดพลาด", message: err.message, isError: true });
    } finally { setConfirmModal({ isOpen: false, title: '', message: '', farmId: null }); }
  };

  // Navigation
  const handleAddNewCalculation = (farmId) => { /* Logic เดิม (ละไว้เพื่อความกระชับ) */ navigate(`/farm/${farmId}/calculate`); };
  const handleViewHistory = (farmId) => {
    const farm = allFarms.find(f => f.farm_id === farmId);
    if (farm) localStorage.setItem(LAST_HISTORY_FARM_KEY, JSON.stringify(farm));
    navigate("/history");
  };

  // ⭐️ Helper: จัดการการกดเลือก (Toggle Selection)
  const toggleFarmSelection = (farmId) => {
    const idStr = farmId.toString();
    let newSelection;
    
    if (selectedFarmIds.includes(idStr)) {
        // ถ้ามีอยู่แล้ว -> เอาออก (Deselect)
        newSelection = selectedFarmIds.filter(id => id !== idStr);
    } else {
        // ถ้ายังไม่มี -> เพิ่มเข้าไป (Select)
        newSelection = [...selectedFarmIds, idStr];
    }
    
    setSelectedFarmIds(newSelection);
    localStorage.setItem(LAST_DASHBOARD_FARM_KEY, JSON.stringify(newSelection));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar /> 
      <Modal isOpen={modal.isOpen} onClose={() => setModal({...modal, isOpen:false})} title={modal.title} message={modal.message} isError={modal.isError} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({...confirmModal, isOpen:false})} onConfirm={executeDelete} title={confirmModal.title} message={confirmModal.message} />

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full"> 
        
        {/* Graph Section */}
        <div className={`bg-white shadow-md rounded-xl p-6 mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
            <h2 className="text-lg text-green-900 font-semibold truncate pr-4">{graphTitle}</h2>
            {selectedFarmIds.length > 0 && (
              <button
                onClick={() => {
                  setSelectedFarmIds([]);
                  localStorage.removeItem(LAST_DASHBOARD_FARM_KEY);
                }}
                className="text-sm text-blue-600 hover:underline flex-shrink-0"
              >
                (ล้างการเลือกทั้งหมด)
              </button>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setShowActual(!showActual)} className={`text-sm px-3 py-1 rounded-full border-2 ${showActual ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'}`}>ผลผลิตจริง</button>
            <button onClick={() => setShowEstimated(!showEstimated)} className={`text-sm px-3 py-1 rounded-full border-2 ${showEstimated ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-300'}`}>ผลผลิตคาดการณ์</button>
          </div>

          <div className="h-72 w-full min-w-[300px]">
            {(isLoading) ? (
              <p className="text-center text-gray-500 pt-10">กำลังโหลดข้อมูล...</p>
            ) : graphData.length === 0 ? (
              <p className="text-center text-gray-500 pt-10">ไม่มีข้อมูลสำหรับแสดงผล</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}> 
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {showEstimated && <Bar dataKey="ผลผลิตคาดการณ์" fill="#ef4444" name="ผลผลิตคาดการณ์" />}
                  {showActual && <Bar dataKey="ผลผลิตจริง" fill="#10b981" name="ผลผลิตจริง" />}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Farm List Section */}
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="text-2xl font-bold text-green-900">สวนของคุณ <span className="text-sm font-normal text-gray-500">(คลิกการ์ดเพื่อเลือกเปรียบเทียบ)</span></h2>
          <div className="flex flex-col md:flex-row gap-3">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ค้นหา..." className="w-full md:w-64 border border-gray-300 rounded-full px-5 py-2" />
            <button onClick={() => navigate("/farmform")} className="bg-green-700 text-white px-5 py-2 rounded-full hover:bg-green-800">+ เพิ่มสวนใหม่</button>
          </div>
        </div>
        
        {/* Grid */}
        {isLoading ? <p>Loading...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {displayedFarms.length > 0 ? (
              displayedFarms.map((farm, index) => {
                // ⭐️ เช็คว่าสวนนี้ถูกเลือกอยู่หรือไม่ (ใน Array)
                const isSelected = selectedFarmIds.includes(farm.farm_id.toString());
                // ⭐️ แสดงลำดับการเลือก (เช่น 1, 2)
                const selectionIndex = selectedFarmIds.indexOf(farm.farm_id.toString()) + 1;

                return (
                  <div 
                    key={farm.farm_id} 
                    onClick={() => toggleFarmSelection(farm.farm_id)}
                    className={`relative transition-all duration-300 rounded-2xl cursor-pointer border-2 ${
                      isSelected 
                        ? 'border-green-500 ring-4 ring-green-100 transform -translate-y-2 shadow-xl' 
                        : 'border-transparent hover:shadow-lg'
                    } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    {/* Badge แสดงลำดับการเลือก */}
                    {isSelected && (
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold shadow-md z-10">
                            {selectionIndex}
                        </div>
                    )}
                    
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
              <p className="text-gray-500 md:col-span-3 text-center py-10">ไม่พบข้อมูลสวน</p> 
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}