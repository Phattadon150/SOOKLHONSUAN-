import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // ⭐️ ใช้ Framer Motion
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AlertModal from "../components/AlertModal";

// Helper: Format ตัวเลข
const formatNum = (num, digits = 0) => {
  const n = Number(num);
  if (!Number.isFinite(n)) return digits === 0 ? "0" : "0.00";
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

// Helper Component: ตัวเลขวิ่ง (CountUp)
const CountUp = ({ value, prefix = "", suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    let totalMilSec = 1000; // เวลาวิ่ง 1 วินาที
    let incrementTime = (totalMilSec / end) * 5; // ปรับความเร็ว

    let timer = setInterval(() => {
      start += (end - start) / 10; // Ease-out effect
      if (Math.abs(end - start) < 1) {
         setDisplayValue(end);
         clearInterval(timer);
      } else {
         setDisplayValue(start);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{prefix}{formatNum(displayValue, 2)}{suffix}</span>;
};


const PIE_COLORS = [
  "#818cf8", "#f87171", "#60a5fa", "#34d399", 
  "#facc15", "#fb923c", "#c084fc",
];

export default function ValueSummary() {
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [farmList, setFarmList] = useState([]);
  const [allCalculations, setAllCalculations] = useState([]);
  const [cropTypes, setCropTypes] = useState({}); 
  
  // State การคำนวณ
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [calculationMode, setCalculationMode] = useState("marketPrice"); 
  const [tempCustomPrice, setTempCustomPrice] = useState(""); 

  // State ผลลัพธ์
  const [marketPrices, setMarketPrices] = useState({}); 
  const [yield6MonthSum, setYield6MonthSum] = useState(0);
  const [yieldSumByFarm, setYieldSumByFarm] = useState(new Map());
  const [pieSegments, setPieSegments] = useState([]);
  const [modalState, setModalState] = useState({ isOpen: false, type: 'error', title: '', message: '' });

  // 1. โหลดข้อมูล
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        const headers = { Authorization: `Bearer ${token}` };
        const apiBase = "http://localhost:4000/api"; 

        const [resFarms, resCrops, resCalcs, resPrices] = await Promise.all([
          fetch(`${apiBase}/farms`, { headers }),
          fetch(`${apiBase}/crop-types`, { headers }),
          fetch(`${apiBase}/calculations`, { headers }),
          fetch(`${apiBase}/market-prices/latest`, { headers }) 
        ]);

        if (!resFarms.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");

        const farmsData = await resFarms.json();
        const cropsData = resCrops.ok ? await resCrops.json() : [];
        const calcsData = await resCalcs.json();
        const pricesData = resPrices.ok ? await resPrices.json() : [];

        const cropMap = {};
        cropsData.forEach(c => cropMap[c.id] = c.name);
        setCropTypes(cropMap);

        const priceMap = {};
        if (Array.isArray(pricesData)) {
          pricesData.forEach(p => priceMap[p.crop_type_id] = parseFloat(p.price_avg));
        } 
        setMarketPrices(priceMap);

        setFarmList(farmsData.map(f => ({
          id: f.id,
          name: f.name,
          crop_type_id: f.crop_type_id,
          custom_price: f.custom_price ? parseFloat(f.custom_price) : null 
        })));

        setAllCalculations(calcsData);
      } catch (err) {
        console.error(err);
      } finally { setIsLoading(false); }
    };
    fetchAllData();
  }, [navigate]);

  // 2. Update Temp Input
  useEffect(() => {
    if (selectedFarmId) {
      const farm = farmList.find(f => f.id == selectedFarmId);
      setTempCustomPrice(farm?.custom_price ? farm.custom_price.toString() : "");
    } else {
      setTempCustomPrice("");
    }
  }, [selectedFarmId, farmList]);

  // 3. Auto-save Custom Price
  const handleSaveCustomPrice = async (newPrice) => {
    const priceVal = parseFloat(newPrice);
    setFarmList(prev => prev.map(f => f.id == selectedFarmId ? { ...f, custom_price: isNaN(priceVal) ? null : priceVal } : f));
    
    if (!selectedFarmId) return;

    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:4000/api/farms/${selectedFarmId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ custom_price: isNaN(priceVal) ? null : priceVal }) 
      });
    } catch (err) { console.error("Failed to save price", err); }
  };

  // 4. Process Yield & Graph
  useEffect(() => {
    if (isLoading) return;
    const calcsForFarm = selectedFarmId ? allCalculations.filter(calc => calc.farm_id == selectedFarmId) : allCalculations;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const calcsLast6Months = calcsForFarm.filter(calc => new Date(calc.calc_date) >= sixMonthsAgo);
    const totalYield = calcsLast6Months.reduce((sum, calc) => sum + Number(calc.actual_yield || calc.estimated_yield || 0), 0);
    setYield6MonthSum(totalYield);

    const yieldMap = new Map();
    if (!selectedFarmId) {
      for (const calc of calcsLast6Months) {
        const kg = Number(calc.actual_yield || calc.estimated_yield || 0);
        const current = yieldMap.get(calc.farm_id) || 0;
        yieldMap.set(calc.farm_id, current + kg);
      }
    }
    setYieldSumByFarm(yieldMap);

    if (totalYield > 0) {
       let currentDegree = 0;
       const segments = calcsLast6Months.map((calc, index) => {
          const kg = Number(calc.actual_yield || calc.estimated_yield || 0);
          const percent = (kg / totalYield);
          const degrees = Math.max(percent * 360, 1.0);
          const seg = { 
              name: new Date(calc.calc_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + (selectedFarmId ? '' : ` (${calc.farm_name || 'Farm'})`),
              kg, percent: percent*100, color: PIE_COLORS[index % PIE_COLORS.length],
              startDegree: currentDegree, endDegree: currentDegree + degrees
          };
          currentDegree += degrees;
          return seg;
       });
       setPieSegments(segments);
    } else { setPieSegments([]); }
  }, [selectedFarmId, allCalculations, isLoading]);


  // 5. Hybrid Calculation Logic
  const calculatedTotalValue = useMemo(() => {
    let totalValue = 0;

    if (selectedFarmId) {
      const farm = farmList.find(f => f.id == selectedFarmId);
      if (!farm) return 0;

      if (calculationMode === 'marketPrice') {
        totalValue = yield6MonthSum * (marketPrices[farm.crop_type_id] || 0);
      } else { 
        const price = parseFloat(tempCustomPrice) || 0;
        totalValue = yield6MonthSum * price;
      }
    } 
    else {
      for (const [farmId, yieldKg] of yieldSumByFarm.entries()) {
        const farm = farmList.find(f => f.id == farmId);
        if (!farm) continue;

        let priceToUse = 0;
        if (calculationMode === 'marketPrice') {
          priceToUse = marketPrices[farm.crop_type_id] || 0;
        } else {
          if (farm.custom_price && farm.custom_price > 0) {
            priceToUse = farm.custom_price;
          } else {
            priceToUse = marketPrices[farm.crop_type_id] || 0;
          }
        }
        totalValue += yieldKg * priceToUse;
      }
    }
    return totalValue;
  }, [calculationMode, selectedFarmId, farmList, yieldSumByFarm, yield6MonthSum, marketPrices, tempCustomPrice]);

  const selectedFarm = farmList.find(f => f.id == selectedFarmId);
  const currentMarketPrice = selectedFarm ? (marketPrices[selectedFarm.crop_type_id] || 0) : 0;
  const gradientString = pieSegments.map(seg => `${seg.color} ${seg.startDegree}deg ${seg.endDegree}deg`).join(', ');

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { staggerChildren: 0.1, duration: 0.5 } 
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse text-green-700">🌱 กำลังโหลดข้อมูลสวน...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <Navbar />
      <motion.main 
        className="flex-1 w-full max-w-3xl mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <h1 className="text-3xl font-bold text-green-900 mb-2 drop-shadow-sm">
            {selectedFarm ? `สรุปมูลค่าสวน (${selectedFarm.name})` : "สรุปมูลค่าสวน (ทุกสวน)"}
          </h1>
          <p className="text-lg text-gray-600">
            {selectedFarm ? "ประเมินรายได้ของสวนนี้" : "ประเมินรายได้รวมทุกสวนแบบอัตโนมัติ"}
          </p>
        </motion.div>

        <motion.div className="mb-6" variants={itemVariants}>
          <select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-3 bg-white shadow-sm focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all cursor-pointer hover:bg-green-50"
          >
            <option value="">-- สรุปทุกสวน (Hybrid Calculation) --</option>
            {farmList.map(farm => (
              <option key={farm.id} value={farm.id}>
                {farm.name} ({cropTypes[farm.crop_type_id] || '-'}) {farm.custom_price ? `[ระบุเอง: ${farm.custom_price}]` : ''}
              </option>
            ))}
          </select>
        </motion.div>

        <motion.div 
          className="bg-white shadow-xl rounded-2xl p-6 mb-6 text-center transform transition hover:scale-[1.02] hover:shadow-2xl duration-300"
          variants={itemVariants}
        >
          <p className="text-gray-700 text-lg font-medium">ผลผลิตรวม 6 เดือนล่าสุด</p>
          <p className="text-green-700 text-5xl font-bold mt-2 tracking-tighter">
            <CountUp value={yield6MonthSum} suffix=" กก." />
          </p>
        </motion.div>

        {/* Control Buttons */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" variants={itemVariants}>
          <button
            onClick={() => setCalculationMode("marketPrice")}
            className={`relative overflow-hidden bg-white shadow-md rounded-2xl p-5 text-left border-2 transition-all duration-300 ${
              calculationMode === "marketPrice" 
                ? "border-green-500 bg-green-50 ring-2 ring-green-200 scale-[1.02]" 
                : "border-transparent hover:shadow-lg hover:border-green-200"
            }`}
          >
            <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800 text-lg">ใช้ราคากลาง</span>
                {calculationMode === "marketPrice" && <span className="text-green-600 text-2xl">✓</span>}
            </div>
            <div className="mt-2 h-8 flex items-center text-sm text-gray-500"> 
               {selectedFarm ? `${formatNum(currentMarketPrice, 2)} บาท/กก.` : "ใช้ราคากลางของพืชแต่ละสวน"}
            </div>
          </button>
          
          <button
            onClick={() => setCalculationMode("customPrice")}
            className={`relative overflow-hidden bg-white shadow-md rounded-2xl p-5 text-left border-2 transition-all duration-300 ${
              calculationMode === "customPrice" 
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 scale-[1.02]" 
                : "border-transparent hover:shadow-lg hover:border-blue-200"
            }`}
          >
             <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800 text-lg">
                   {selectedFarm ? "ระบุราคาเอง" : "ราคาผสม (Hybrid)"}
                </span>
                {calculationMode === "customPrice" && <span className="text-blue-600 text-2xl">✎</span>}
            </div>
            
            <div className="mt-2 flex items-center gap-2 h-8">
                {selectedFarm ? (
                    <div className="flex items-baseline gap-2 w-full">
                        <input 
                          type="number" 
                          value={tempCustomPrice}
                          onChange={(e) => setTempCustomPrice(e.target.value)}
                          onBlur={(e) => handleSaveCustomPrice(e.target.value)} 
                          onClick={(e) => { e.stopPropagation(); setCalculationMode("customPrice"); }}
                          placeholder="0.00"
                          className="w-full max-w-[120px] text-blue-600 text-2xl font-bold border-b-2 border-gray-300 bg-transparent outline-none focus:border-blue-500 transition-all"
                        />
                        <span className="text-sm text-gray-500">บาท/กก.</span>
                    </div>
                ) : (
                    <span className="text-sm text-blue-600 font-medium animate-pulse">
                        สวนไหนไม่ระบุ จะใช้ราคากลางแทน ✅
                    </span>
                )}
            </div>
          </button>
        </motion.div>

        {/* Total Value */}
        <motion.div 
          className="bg-gradient-to-br from-green-50 to-white shadow-xl rounded-2xl p-8 mb-8 text-center border border-green-100 relative overflow-hidden"
          variants={itemVariants}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
          <p className="text-gray-600 text-xl font-medium">มูลค่ารวมโดยประมาณ</p>
          <p className="text-green-800 text-6xl font-extrabold my-4 tracking-tight drop-shadow-sm">
             <CountUp value={calculatedTotalValue} />
          </p>
          <p className="text-gray-500 text-lg font-medium bg-white/50 inline-block px-4 py-1 rounded-full">บาท (THB)</p>
        </motion.div>

        {/* Pie Chart Area */}
        <motion.div 
          className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100"
          variants={itemVariants}
        >
            <h2 className="text-xl font-bold mb-6 text-gray-800 border-l-4 border-green-500 pl-3">สัดส่วนผลผลิต</h2>
            <div className="flex flex-col md:flex-row items-center gap-10 justify-center">
                
                <motion.div 
                  className="relative w-56 h-56 rounded-full flex-shrink-0 shadow-inner border-4 border-white ring-1 ring-gray-200"
                  style={{ background: pieSegments.length ? `conic-gradient(from -90deg, ${gradientString})` : '#f3f4f6' }}
                  initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  transition={{ duration: 1, ease: "backOut" }}
                >
                   {!pieSegments.length && <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">ไม่มีข้อมูล</div>}
                </motion.div>

                <div className="flex-1 w-full max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {pieSegments.map((seg, i) => (
                        <motion.div 
                          key={i} 
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors cursor-default"
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                        >
                            <span className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" style={{backgroundColor: seg.color}}></span>
                            <span className="flex-1 truncate text-gray-700 font-medium">{seg.name}</span>
                            <span className="font-bold text-green-800 bg-white px-2 py-1 rounded-md shadow-sm text-sm">{formatNum(seg.kg, 0)} กก.</span>
                        </motion.div>
                    ))}
                    {!pieSegments.length && <div className="text-center text-gray-400 py-4">ยังไม่มีประวัติการคำนวณ</div>}
                </div>
            </div>
        </motion.div>

      </motion.main>
      <Footer />
      <AlertModal isOpen={modalState.isOpen} onClose={() => setModalState({...modalState, isOpen:false})} type={modalState.type} title={modalState.title} message={modalState.message} />
    </div>
  );
}