// History.jsx (ฉบับเต็ม - แก้ไขระยะห่าง Sticky Sidebar)

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// (Helper: Format ตัวเลข ... เหมือนเดิม)
const formatNum = (num, digits = 0) => {
  const n = Number(num);
  if (!Number.isFinite(n) || n === 0) return digits === 0 ? "0" : "0.00";
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

// (ข้อมูลสำหรับ Dropdowns ... เหมือนเดิม)
const thaiMonths = [
  { value: "1", name: "มกราคม" }, { value: "2", name: "กุมภาพันธ์" },
  { value: "3", name: "มีนาคม" }, { value: "4", name: "เมษายน" },
  { value: "5", name: "พฤษภาคม" }, { value: "6", name: "มิถุนายน" },
  { value: "7", name: "กรกฎาคม" }, { value: "8", name: "สิงหาคม" },
  { value: "9", name: "กันยายน" }, { value: "10", name: "ตุลาคม" },
  { value: "11", name: "พฤศจิกายน" }, { value: "12", name: "ธันวาคม" },
];
const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const currentBuddhistYear = new Date().getFullYear() + 543;
const years = Array.from({ length: 10 }, (_, i) => (currentBuddhistYear - i).toString());

// ⭐️ 1. กำหนด Key สำหรับ localStorage
const LAST_FARM_KEY = "sook_lon_suan_last_selected_farm";

export default function History() {
  const navigate = useNavigate();

  // ( ... State ทั้งหมด ... เหมือนเดิม )
  const [allCalculations, setAllCalculations] = useState([]);
  const [farmList, setFarmList] = useState([]);
  const [displayedFarms, setDisplayedFarms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFarm, setSelectedFarm] = useState(null); 
  const [stats, setStats] = useState({ max: 0, min: 0, avg: 0 });
  const [graphData, setGraphData] = useState([]);
  const [graphTitle, setGraphTitle] = useState("แนวโน้มผลผลิต (กรุณาเลือกสวน)");
  const [isLoading, setIsLoading] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [showEstimated, setShowEstimated] = useState(true);
  const [filteredCalculations, setFilteredCalculations] = useState([]);
  const [displayedCalculations, setDisplayedCalculations] = useState([]);
  const [searchDay, setSearchDay] = useState("");
  const [searchMonth, setSearchMonth] = useState("");
  const [searchYear, setSearchYear] = useState("");

  // ( ... useEffect (ดึงข้อมูล) ... )
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("http://localhost:4000/api/calculations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
        const data = await res.json(); 
        setAllCalculations(data); 

        const farmMap = new Map();
        for (const calc of data) {
          if (!farmMap.has(calc.farm_id)) {
            farmMap.set(calc.farm_id, {
              farm_id: calc.farm_id,
              farm_name: calc.farm_name || `ฟาร์ม (ID: ${calc.farm_id})`,
              location: calc.location
            });
          }
        }
        const uniqueFarms = Array.from(farmMap.values());
        setFarmList(uniqueFarms);
        setDisplayedFarms(uniqueFarms); 

        // --- ⭐️ 2. ตรวจสอบการเลือกล่าสุดจาก localStorage ---
        try {
          const savedFarmJSON = localStorage.getItem(LAST_FARM_KEY);
          if (savedFarmJSON) {
            const savedFarm = JSON.parse(savedFarmJSON);
            const farmExists = uniqueFarms.some(f => f.farm_id === savedFarm.farm_id);
            if (farmExists) {
              setSelectedFarm(savedFarm); 
            } else {
              localStorage.removeItem(LAST_FARM_KEY); 
            }
          }
        } catch (e) {
          console.error("Failed to parse saved farm from localStorage", e);
          localStorage.removeItem(LAST_FARM_KEY);
        }
        // --- ⭐️ (สิ้นสุดส่วนที่แก้ไข) ---

      } catch (err) {
        alert(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // ( ... useEffect (ค้นหาฟาร์ม) ... เหมือนเดิม )
  useEffect(() => {
    if (!searchTerm) {
      setDisplayedFarms(farmList);
      return;
    }
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = farmList.filter(farm => 
      farm.farm_name.toLowerCase().includes(lowerSearch) ||
      (farm.location && farm.location.toLowerCase().includes(lowerSearch))
    );
    setDisplayedFarms(filtered);
  }, [searchTerm, farmList]);

  // ( ... useEffect (คำนวณสถิติ/กราฟ) ... เหมือนเดิม )
  useEffect(() => {
    if (!selectedFarm) {
      setFilteredCalculations([]);
      setStats({ max: 0, min: 0, avg: 0 });
      setGraphData([]);
      setGraphTitle("แนวโน้มผลผลิต (กรุณาเลือกสวน)");
      return;
    }
    const calcsForFarm = allCalculations.filter(
      calc => calc.farm_id === selectedFarm.farm_id
    );
    setFilteredCalculations(calcsForFarm.sort((a, b) => new Date(b.calc_date) - new Date(a.calc_date)));
    if (calcsForFarm.length > 0) {
      const yields = calcsForFarm.map(d => d.actual_yield ?? d.estimated_yield).filter(Boolean);
      if (yields.length > 0) {
        const sum = yields.reduce((a, b) => a + b, 0);
        setStats({
          max: Math.max(...yields),
          min: Math.min(...yields),
          avg: (sum / yields.length) || 0,
        });
      } else {
        setStats({ max: 0, min: 0, avg: 0 });
      }
      const formattedGraphData = calcsForFarm.map(calc => ({
        name: new Date(calc.calc_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
        "ผลผลิตจริง": calc.actual_yield ?? null, 
        "ผลผลิตคาดการณ์": calc.estimated_yield ?? null, 
      })).reverse();
      setGraphData(formattedGraphData);
    } else {
      setStats({ max: 0, min: 0, avg: 0 });
      setGraphData([]);
    }
    setGraphTitle(`แนวโน้มผลผลิต (สวน: ${selectedFarm.farm_name})`);
  }, [selectedFarm, allCalculations]); 

  
  // ( ... useEffect (ฟิลเตอร์วันที่ พ.ศ.) ... เหมือนเดิม )
  useEffect(() => {
    const getLocalDateParts = (isoString) => {
        const d = new Date(isoString);
        return {
            day: d.getDate().toString(),
            month: (d.getMonth() + 1).toString(),
            year: (d.getFullYear() + 543).toString()
        };
    };
    let displayed = filteredCalculations;
    if (searchYear) {
        displayed = displayed.filter(calc => getLocalDateParts(calc.calc_date).year === searchYear);
    }
    if (searchMonth) {
        displayed = displayed.filter(calc => getLocalDateParts(calc.calc_date).month === searchMonth);
    }
    if (searchDay) {
        displayed = displayed.filter(calc => getLocalDateParts(calc.calc_date).day === searchDay);
    }
    setDisplayedCalculations(displayed);
  }, [searchDay, searchMonth, searchYear, filteredCalculations]); 


  // ( ... ฟังก์ชัน handleDelete, handleViewDetail, handleAddNewCalculation ... เหมือนเดิม)
  const handleDelete = async (id) => {
    if (!window.confirm(`คุณแน่ใจหรือว่าต้องการลบรายการที่ ${id}?`)) {
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    try {
      const response = await fetch(`http://localhost:4000/api/calculations/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) { throw new Error("ลบไม่สำเร็จ"); }
      const newList = allCalculations.filter(item => item.id !== id);
      setAllCalculations(newList);
    } catch (err) {
      console.error("Error deleting:", err);
      alert(`เกิดข้อผิดพลาดในการลบ: ${err.message}`);
    }
  };
  
  const handleViewDetail = (calculationItem) => {
    const dataForSummary = {
      preview: false, 
      input: { /* ... (ข้อมูล input ... ) */ },
      result: calculationItem
    };
    navigate(`/farm/${calculationItem.farm_id}/summary`, {
      state: { calculationData: dataForSummary }
    });
  };
  
  const handleAddNewCalculation = () => {
    if (!selectedFarm) return;
    const latestCalc = filteredCalculations[0];
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
    navigate(`/farm/${selectedFarm.farm_id}/calculate`, {
      state: { 
        preloadData: preloadData 
      },
    });
  };

  // ( ... ฟังก์ชันล้างฟิลเตอร์ ... เหมือนเดิม )
  const clearDateFilter = () => {
    setSearchDay("");
    setSearchMonth("");
    setSearchYear("");
  };

  // ( ... ส่วน Loading ... เหมือนเดิม )
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-stone-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p>กำลังโหลดข้อมูลประวัติ...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // ------------------------------------
  // ( JSX Layout )
  // ------------------------------------
  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-green-900 mb-2">
          ประวัติ (รายสวน)
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          เลือกสวนที่ต้องการดูข้อมูลสถิติและประวัติการคำนวณ
        </p>

        {/* Wrapper 2 คอลัมน์ */}
        <div className="flex flex-col lg:flex-row lg:gap-6">

          {/* --------------------------- */}
          {/* คอลัมน์ซ้าย (เนื้อหาหลัก) */}
          {/* --------------------------- */}
          <div className="flex-1 w-full lg:w-2/3">
            
            <AnimatePresence mode="wait">
              {selectedFarm ? (
                <motion.div
                  key={selectedFarm.farm_id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-6"
                >
                  
                  {/* --- Card: สรุปค่าสถิติ (เนื้อหาครบ) --- */}
                  <div className="bg-white shadow-xl rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-green-900 mb-4">
                      สรุปสถิติ (สวน: {selectedFarm.farm_name})
                    </h2>
                    <div className="grid grid-cols-3 divide-x divide-gray-200 text-center">
                      <div>
                        <p className="text-sm text-gray-500">ค่าสูงสุด</p>
                        <p className="text-xl font-bold text-green-800">
                          {formatNum(stats.max)} กก.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">ค่าต่ำสุด</p>
                        <p className="text-xl font-bold text-gray-800">
                          {formatNum(stats.min)} กก.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">ค่าเฉลี่ย</p>
                        <p className="text-xl font-bold text-gray-800">
                          {formatNum(stats.avg)} กก.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* --- Card: กราฟแนวโน้ม (เนื้อหาครบ) --- */}
                  <div className="bg-white shadow-xl rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-green-900 mb-2">
                      {graphTitle}
                    </h2>
                    <div className="flex gap-2 mb-4">
                      <motion.button
                        onClick={() => setShowActual(!showActual)}
                        className={`text-sm px-3 py-1 rounded-full border-2 ${
                          showActual 
                            ? 'bg-green-600 text-white border-green-600' 
                            : 'bg-white text-gray-600 border-gray-300'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ผลผลิตจริง
                      </motion.button>
                      <motion.button
                        onClick={() => setShowEstimated(!showEstimated)}
                        className={`text-sm px-3 py-1 rounded-full border-2 ${
                          showEstimated
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-gray-600 border-gray-300'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ผลผลิตคาดการณ์
                      </motion.button>
                    </div>
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {showActual && (
                            <Line type="monotone" dataKey="ผลผลิตจริง" stroke="#10b981" strokeWidth={2} />
                          )}
                          {showEstimated && (
                            <Line type="monotone" dataKey="ผลผลิตคาดการณ์" stroke="#ef4444" strokeWidth={2} />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* --- ส่วน: รายการบันทึก (เนื้อหาครบ) --- */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-green-900">
                        รายการบันทึก ({displayedCalculations.length} รายการ)
                      </h2>
                      <motion.button
                        onClick={handleAddNewCalculation} 
                        className="bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md hover:bg-green-800 transition"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        + เพิ่มการบันทึก
                      </motion.button>
                    </div>

                    {/* (ช่องฟิลเตอร์วันที่ พ.ศ. ... เหมือนเดิม) */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ค้นหาตามวันที่บันทึก (พ.ศ.):
                      </label>
                      <div className="flex flex-wrap gap-2 items-center">
                        <select 
                          value={searchDay}
                          onChange={(e) => setSearchDay(e.target.value)}
                          className="border border-gray-300 rounded-full px-4 py-2 bg-white"
                        >
                          <option value="">-- วันที่ --</option>
                          {days.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select 
                          value={searchMonth}
                          onChange={(e) => setSearchMonth(e.target.value)}
                          className="border border-gray-300 rounded-full px-4 py-2 bg-white"
                        >
                          <option value="">-- เดือน --</option>
                          {thaiMonths.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                        </select>
                        <select 
                          value={searchYear}
                          onChange={(e) => setSearchYear(e.target.value)}
                          className="border border-gray-300 rounded-full px-4 py-2 bg-white"
                        >
                          <option value="">-- ปี พ.ศ. --</option>
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        {(searchDay || searchMonth || searchYear) && (
                          <button
                            onClick={clearDateFilter}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            (ล้าง)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* (รายการที่แสดง) */}
                    <div className="flex flex-col gap-4">
                      <AnimatePresence>
                        {displayedCalculations.map((item, index) => {
                          const hasActual = item.actual_yield != null && item.actual_yield > 0;
                          return (
                            <motion.div 
                              key={item.id} 
                              className="bg-white shadow-xl rounded-2xl p-5"
                              layout 
                              initial={{ opacity: 0, x: -30 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 30 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <div className="flex items-center gap-3 mb-4">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold text-sm">
                                  {displayedCalculations.length - index} 
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {new Date(item.calc_date).toLocaleDateString("th-TH", {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                                <div>
                                  <p className="text-sm text-gray-500">จังหวัด</p>
                                  <p className="font-semibold text-gray-900">{item.location}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">พื้นที่ (ไร่)</p>
                                  <p className="font-semibold text-gray-900">{formatNum(item.area_rai, 2)}</p>
                                </div>
                                {hasActual ? (
                                  <div>
                                    <p className="text-sm text-gray-500">ผลผลิตจริง</p>
                                    <p className="font-bold text-blue-600">{formatNum(item.actual_yield)} กก.</p>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-sm text-gray-500">ผลผลิตคาดหวัง</p>
                                    <p className="font-bold text-green-700">{formatNum(item.estimated_yield)} กก.</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-end gap-3 border-t border-gray-100 pt-3 mt-3">
                                <motion.button
                                  onClick={() => handleViewDetail(item)}
                                  className="text-sm border border-green-600 text-green-600 px-4 py-1 rounded-full hover:bg-green-50 transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {hasActual ? 'ดู/แก้ไขรายละเอียด' : 'บันทึกผลผลิตจริง'}
                                </motion.button>
                                <motion.button
                                  onClick={() => handleDelete(item.id)}
                                  className="text-sm border border-red-500 text-red-500 px-4 py-1 rounded-full hover:bg-red-50 transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  ลบ
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      
                      {/* (แสดงผลลัพธ์การค้นหา) */}
                      {(searchDay || searchMonth || searchYear) && displayedCalculations.length === 0 && (
                        <motion.p 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="text-center text-gray-500 py-4"
                        >
                          ไม่พบรายการที่ตรงกับวันที่ค้นหา
                        </motion.p>
                      )}
                      {/* (กรณีไม่มีข้อมูลเลย) */}
                      {filteredCalculations.length === 0 && (
                          <motion.p 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center text-gray-500 py-4"
                          >
                            ยังไม่มีการบันทึกสำหรับสวนนี้
                          </motion.p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                // (หน้าจอตอนที่ยังไม่ได้เลือกฟาร์ม)
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center text-gray-500 p-10 bg-white rounded-2xl shadow-xl"
                >
                  <p>กรุณาเลือกสวนจากรายการด้านขวาเพื่อดูข้อมูล</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* --------------------------- */}
          {/* คอลัมน์ขวา (Sidebar) */}
          {/* --------------------------- */}
          <div 
            className="w-full lg:w-1/3 mt-6 lg:mt-0 lg:sticky lg:top-24" // ⭐️⭐️⭐️ แก้ไขตรงนี้ ⭐️⭐️⭐️
            style={{ alignSelf: 'start' }} 
          >
            <div className="bg-white shadow-xl rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-4">
                ค้นหาและเลือกสวน
              </h2>
              <input 
                type="text"
                placeholder="พิมพ์ชื่อสวน หรือ จังหวัด..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} // (โค้ดเดิมมี e.g.value น่าจะพิมพ์ผิด ผมแก้เป็น e.target.value)
                className="w-full border border-gray-300 rounded-full px-4 py-2 mb-4"
              />
              {selectedFarm && (
                <button
                  // --- ⭐️ 4. เพิ่มการลบออกจาก localStorage ---
                  onClick={() => {
                    setSelectedFarm(null);
                    localStorage.removeItem(LAST_FARM_KEY); 
                  }}
                  className="text-sm text-blue-600 hover:underline mb-4"
                >
                  (ล้างการเลือก)
                </button>
              )}
              <div className="flex flex-col gap-3 max-h-[70vh] lg:max-h-[60vh] overflow-y-auto">
                <AnimatePresence>
                  {displayedFarms.length > 0 ? (
                    displayedFarms.map(farm => (
                      <motion.button
                        key={farm.farm_id}
                        // --- ⭐️ 5. เพิ่มการบันทึกลง localStorage ---
                        onClick={() => {
                          setSelectedFarm(farm);
                          localStorage.setItem(LAST_FARM_KEY, JSON.stringify(farm)); 
                        }}
                        className={`text-left p-3 rounded-lg transition-colors
                          ${selectedFarm?.farm_id === farm.farm_id 
                            ? 'bg-green-600 text-white shadow'
                            : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        layout 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="font-semibold">{farm.farm_name}</p>
                        <p className="text-sm">{farm.location}</p>
                      </motion.button>
                    ))
                  ) : (
                    <motion.p 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-gray-500 text-center"
                    >
                      ไม่พบสวนที่ค้นหา
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}