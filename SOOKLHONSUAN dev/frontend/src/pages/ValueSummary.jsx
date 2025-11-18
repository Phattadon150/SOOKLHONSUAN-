// ValueSummary.jsx (ฉบับอัปเกรด: แก้ปัญหา 'unknown' โดยการ Assume ใน Frontend)

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AlertModal from "../components/AlertModal";

// (Helper: Format ตัวเลข ... เหมือนเดิม)
const formatNum = (num, digits = 0) => {
  const n = Number(num);
  if (!Number.isFinite(n) || n === 0) return digits === 0 ? "0" : "0.00";
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

// (สีสำหรับกราฟ ... เหมือนเดิม)
const PIE_COLORS = [
  "#818cf8", "#f87171", "#60a5fa", "#34d399", 
  "#facc15", "#fb923c", "#c084fc",
];

// ⭐️ (ใหม่) ตารางค้นหาชนิดพืช (สำหรับแก้ 'unknown' ชั่วคราว)
// (นี่คือส่วนที่เรา "Assume" หรือ "สมมติ" ตัวเลขตามที่คุณขอ)
const TEMP_FRUIT_LOOKUP = {
  1: 'longan',  // (สมมติ ID 1 คือสวนลำไย)
  2: 'durian',  // (สมมติ ID 2 คือสวนทุเรียน)
  // (หากคุณมี ID 3, 4, 5... ให้เพิ่มที่นี่)
};


export default function ValueSummary() {
  const navigate = useNavigate();
  const [calculationMode, setCalculationMode] = useState("marketPrice");
  
  // (State ดึงข้อมูล)
  const [isLoading, setIsLoading] = useState(true);
  const [allCalculations, setAllCalculations] = useState([]);
  const [farmList, setFarmList] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");

  // (State ประมวลผล)
  const [yield6MonthSum, setYield6MonthSum] = useState(0);
  const [yieldSumByFarm, setYieldSumByFarm] = useState(new Map());
  const [pieSegments, setPieSegments] = useState([]);
  
  // (State Modal)
  const [modalState, setModalState] = useState({ isOpen: false, type: 'error', title: '', message: '' });
  
  // (State ราคากลาง)
  const [customPrice, setCustomPrice] = useState("");
  const [marketPrices, setMarketPrices] = useState({});
  const [isPriceLoading, setIsPriceLoading] = useState(true);


  // 1. useEffect - ดึงข้อมูล Calculation ทั้งหมด (ตอนโหลด)
  // -----------------------------------------------------
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
        if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลการคำนวณทั้งหมดได้");
        
        // (ใช้ data จริง)
        const data = await res.json(); 
        setAllCalculations(data); 

        // สร้าง Farm List (สำหรับ Dropdown)
        const farmMap = new Map();
        for (const calc of data) {
          if (!farmMap.has(calc.farm_id)) {
            
            // ⭐️ (แก้ไข) Logic การค้นหา fruit_type
            // 1. ลองหาจากข้อมูลที่ส่งมา (เผื่ออนาคต)
            let fruitType = calc.fruit_type; 
            
            // 2. ถ้าไม่เจอ ให้หาจากตารางชั่วคราว
            if (!fruitType) {
              fruitType = TEMP_FRUIT_LOOKUP[calc.farm_id];
            }

            farmMap.set(calc.farm_id, {
              id: calc.farm_id, 
              name: calc.farm_name || `ฟาร์ม (ID: ${calc.farm_id})`,
              fruit_type: fruitType || 'unknown', // 👈 (ถ้าไม่เจอจริงๆ ค่อย unknown)
              saved_price: calc.farm_saved_price,
            });
          }
        }
        
        const realFarms = Array.from(farmMap.values());

        // (เพิ่มฟาร์มตัวอย่าง)
        const demoFarms = [
          {
            id: 'demo-1', 
            name: "ฟาร์มตัวอย่าง 1 (ลิ้นจี่)",
            fruit_type: 'lychee',
            saved_price: null 
          },
          {
            id: 'demo-2',
            name: "ฟาร์มตัวอย่าง 2 (มะม่วง)",
            fruit_type: 'mango',
            saved_price: 85.00
          }
        ];

        setFarmList([...realFarms, ...demoFarms]); // (รวมฟาร์มจริง + ตัวอย่าง)

      } catch (err) {
        setModalState({ isOpen: true, type: 'error', title: 'เกิดข้อผิดพลาด', message: err.message });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);

  
  // 2. useEffect - ดึง API ราคากลาง
  // -----------------------------------------------------
  useEffect(() => {
    if (!farmList.length) return;
    
    setIsPriceLoading(true);
    setMarketPrices({});

    const fetchMarketPrices = async () => {
      let fruitsToFetch = [];
      
      if (selectedFarmId) {
        // (กรณีเลือกฟาร์มเดียว)
        const farm = farmList.find(f => f.id == selectedFarmId); 
        if (farm) {
          fruitsToFetch = [farm.fruit_type];
        }
      } else {
        // (กรณีเลือก "ทุกสวน")
        fruitsToFetch = [...new Set(farmList.map(f => f.fruit_type))];
      }
      
      if (fruitsToFetch.length === 0) {
        setIsPriceLoading(false);
        return;
      }
      
      // ⚠️ TODO: นี่คือส่วนจำลอง API
      const timer = setTimeout(() => {
        // (จำลองผลลัพธ์จาก API)
        const simulatedPrices = {};
        if (fruitsToFetch.includes('longan')) simulatedPrices['longan'] = 65.50; // 👈 (ราคาจริง)
        if (fruitsToFetch.includes('durian')) simulatedPrices['durian'] = 120.00; // 👈 (ราคาจริง)
        if (fruitsToFetch.includes('unknown')) simulatedPrices['unknown'] = 0;
        
        // (ราคาตัวอย่าง)
        if (fruitsToFetch.includes('lychee')) simulatedPrices['lychee'] = 70.00;
        if (fruitsToFetch.includes('mango')) simulatedPrices['mango'] = 55.00;
        
        setMarketPrices(simulatedPrices);
        setIsPriceLoading(false);
      }, 1000);

      return () => clearTimeout(timer); 
    };
    
    fetchMarketPrices();
  }, [selectedFarmId, farmList]);

  
  // 3. useEffect - ประมวลผลข้อมูลใหม่ (เมื่อตัวกรองเปลี่ยน)
  useEffect(() => {
    // (กรองข้อมูลตามฟาร์มที่เลือก)
    const calcsForFarm = selectedFarmId 
      ? allCalculations.filter(calc => calc.farm_id == selectedFarmId) 
      : allCalculations;

    // (กรองข้อมูล 6 เดือน)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const calcsLast6Months = calcsForFarm.filter(calc => {
      const calcDate = new Date(calc.calc_date);
      return calcDate >= sixMonthsAgo;
    });
    
    calcsLast6Months.sort((a, b) => new Date(a.calc_date) - new Date(b.calc_date));

    // (1. คำนวณยอดรวม กก.)
    const totalYield = calcsLast6Months.reduce((sum, calc) => {
      return sum + (calc.actual_yield ?? calc.estimated_yield ?? 0);
    }, 0);
    setYield6MonthSum(totalYield);
    
    // (2. คำนวณยอดรวม กก. แบบแยกฟาร์ม (สำหรับ Logic "ทุกสวน"))
    const yieldMap = new Map();
    if (!selectedFarmId) {
      for (const calc of calcsLast6Months) {
        const kg = (calc.actual_yield ?? calc.estimated_yield ?? 0);
        const current = yieldMap.get(calc.farm_id) || 0;
        yieldMap.set(calc.farm_id, current + kg);
      }
    }
    setYieldSumByFarm(yieldMap);

    // (3. สร้างข้อมูลกราฟ)
    if (totalYield > 0) {
      let currentDegree = 0;
      const segments = calcsLast6Months.map((calc, index) => {
        const kg = (calc.actual_yield ?? calc.estimated_yield ?? 0);
        const percent = (kg / totalYield);
        const degrees = Math.max(percent * 360, 1.0); 
        
        const segmentData = {
          name: new Date(calc.calc_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + (selectedFarmId ? '' : ` (${calc.farm_name})`),
          kg: kg,
          percent: percent * 100,
          color: PIE_COLORS[index % PIE_COLORS.length],
          startDegree: currentDegree,
          endDegree: currentDegree + degrees,
        };
        currentDegree += degrees;
        return segmentData;
      });
      setPieSegments(segments);
    } else {
      setPieSegments([]);
    }
  }, [selectedFarmId, allCalculations]);
  

  // 4. (Logic ใหม่) คำนวณมูลค่ารวม (ใช้ useMemo)
  const calculatedTotalValue = useMemo(() => {
    if (isPriceLoading) return 0;
    
    let totalValue = 0;

    if (selectedFarmId) {
      // (กรณี A: เลือกฟาร์มเดียว)
      const farm = farmList.find(f => f.id == selectedFarmId); 
      if (!farm) return 0;
      
      if (calculationMode === 'marketPrice') {
        const price = marketPrices[farm.fruit_type] || 0;
        totalValue = yield6MonthSum * price;
      } else { // 'customPrice'
        const price = parseFloat(customPrice) || 0;
        totalValue = yield6MonthSum * price;
      }
      
    } else {
      // (กรณี B: เลือก "ทุกสวน")
      
      if (calculationMode === 'marketPrice') {
        // (B1: ทุกสวน - ใช้ราคากลาง)
        for (const [farmId, yieldKg] of yieldSumByFarm.entries()) {
          const farm = farmList.find(f => f.id == farmId); 
          if (!farm) continue;
          
          const price = marketPrices[farm.fruit_type] || 0;
          totalValue += yieldKg * price;
        }
        
      } else { // 'customPrice' (Logic ที่ user ขอ)
        // (B2: ทุกสวน - ใช้ราคาจริง/ทดแทน)
        for (const [farmId, yieldKg] of yieldSumByFarm.entries()) {
          const farm = farmList.find(f => f.id == farmId); 
          if (!farm) continue;

          let price = farm.saved_price; 
          
          if (!price || price === 0) {
            price = marketPrices[farm.fruit_type] || 0;
          }
          
          totalValue += yieldKg * price;
        }
      }
    }
    
    return totalValue;

  }, [
    calculationMode, selectedFarmId, farmList, 
    yieldSumByFarm, yield6MonthSum, 
    marketPrices, customPrice, isPriceLoading
  ]);


  // (สร้าง Gradient - เหมือนเดิม)
  const gradientString = pieSegments.map(seg => 
    `${seg.color} ${seg.startDegree}deg ${seg.endDegree}deg`
  ).join(', ');

  // (หาชื่อฟาร์มที่เลือก - เหมือนเดิม)
  const selectedFarm = selectedFarmId 
    ? farmList.find(f => f.id == selectedFarmId) 
    : null;
  const headerTitle = selectedFarm 
    ? `สรุปมูลค่าสวน (${selectedFarm.name})`
    : "สรุปมูลค่าสวน (ทุกสวน)";


  // (หน้า Loading - เหมือนเดิม)
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-stone-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p>กำลังโหลดข้อมูล...</p>
        </main>
        <Footer />
      </div>
    );
  }
  
  // ------------------------------------
  // ( JSX RENDER )
  // ------------------------------------
  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <Navbar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        
        {/* (ส่วนหัวข้อ - เหมือนเดิม) */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
        >
          <h1 className="text-3xl font-bold text-green-900 mb-2">
            {headerTitle}
          </h1>
          <p className="text-lg text-gray-600">
            ประเมินมูลค่าผลผลิตรวมของคุณ (6 เดือนล่าสุด)
          </p>
        </motion.div>

        {/* (Dropdown เลือกสวน - เหมือนเดิม) */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <label className="block text-gray-700 mb-1 font-semibold">
            เลือกสวน
          </label>
          <select
            value={selectedFarmId}
            onChange={(e) => {
              setSelectedFarmId(e.target.value);
              setCustomPrice(""); 
            }}
            className="w-full border border-gray-300 rounded-full px-4 py-2 bg-white"
          >
            <option value="">-- สรุปทุกสวน --</option>
            {farmList.map(farm => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>
        </motion.div>

        {/* (Card 1: ยอดรวม 6 เดือน - เหมือนเดิม) */}
        <motion.div 
          key={`card1-${selectedFarmId}`} 
          className="bg-white shadow-xl rounded-2xl p-6 mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <p className="text-gray-700 text-lg">
            ผลผลิตรวม 6 เดือนล่าสุด (ที่เลือก)
          </p>
          <p className="text-green-800 text-4xl font-bold">
            {formatNum(yield6MonthSum, 2)}
            <span className="text-2xl font-medium"> กก.</span>
          </p>
        </motion.div>

        {/* Section: คำนวณมูลค่า - เหมือนเดิม */}
        <motion.h2 
          className="text-xl font-semibold text-green-900 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          คำนวณมูลค่า (จากยอด 6 เดือน)
        </motion.h2>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {/* (Card ราคากลาง - Logic ใหม่ - เหมือนเดิม) */}
          <motion.button
            onClick={() => setCalculationMode("marketPrice")}
            className={`bg-white shadow-xl rounded-2xl p-4 text-left transition-all ${
              calculationMode === "marketPrice"
                ? "ring-2 ring-green-600"
                : "opacity-70 hover:opacity-100"
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            disabled={isPriceLoading}
          >
            <span className="font-semibold text-gray-800">
              ใช้ราคากลาง (จาก API)
            </span>
            <div className="mt-1 h-8"> 
              {isPriceLoading ? (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  กำลังดึงราคากลาง...
                </div>
              ) : selectedFarm ? (
                <div className="flex items-baseline gap-2">
                  <p className="text-red-600 text-2xl font-bold">
                    {/* (แก้) ตรวจสอบว่ามีราคาหรือไม่ */} 
                    {marketPrices[selectedFarm.fruit_type] ? formatNum(marketPrices[selectedFarm.fruit_type], 2) : "ไม่มีราคากลาง"}
                  </p>
                  <span className="text-sm text-gray-500">บาท/กก. ({selectedFarm.fruit_type})</span>
                </div>
              ) : (
                <div className="text-sm text-gray-600 pt-1">
                  คำนวณจากราคากลางของแต่ละสวน
                </div>
              )}
            </div>
          </motion.button>
          
          {/* (Card ราคาที่กรอกเอง - Logic ใหม่ - เหมือนเดิม) */}
          <motion.button
            onClick={() => setCalculationMode("customPrice")}
            className={`bg-white shadow-xl rounded-2xl p-4 text-left transition-all ${
              calculationMode === "customPrice"
                ? "ring-2 ring-green-600"
                : "opacity-70 hover:opacity-100"
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="font-semibold text-gray-800">
              {selectedFarm ? "กรอกราคาที่ขายได้จริง" : "ใช้ราคาที่ขายได้จริง (ที่บันทึกไว้)"}
            </span>
            <div className="mt-1 h-8">
              {selectedFarm ? (
                <div className="flex items-baseline gap-2 h-8">
                  <input 
                    type="number" 
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="0.00"
                    className="w-full text-blue-600 text-2xl font-bold border-b-2 border-gray-200 outline-none focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-500">บาท/กก.</span>
                </div>
              ) : (
                <div className="text-sm text-gray-600 pt-1">
                  คำนวณจากราคาจริง (ถ้ามี)
                  <br/>
                  <span className="text-xs text-gray-500">(ถ้าไม่มี ใช้ราคากลางทดแทน)</span>
                </div>
              )}
            </div>
          </motion.button>
        </motion.div>
        
        {/* (Card 3: สรุปมูลค่า - เหมือนเดิม) */}
        <motion.div 
          key={`card3-${selectedFarmId}-${calculationMode}-${customPrice}-${JSON.stringify(marketPrices)}`} 
          className="bg-white shadow-xl rounded-2xl p-6 mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <p className="text-gray-700 text-lg">
            มูลค่าที่คำนวณได้ (จากยอด 6 เดือน)
          </p>
          <p className="text-green-800 text-5xl font-bold my-2">
            {formatNum(calculatedTotalValue, 2)}
          </p>
          <p className="text-gray-700 text-lg">บาท</p>
        </motion.div>


        {/* (Section: สัดส่วนผลผลิต - เหมือนเดิม) */}
        <motion.h2 
          className="text-xl font-semibold text-green-900 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          สัดส่วนผลผลิต (6 เดือนล่าสุด)
        </motion.h2> 
        
        {/* (Card 4: กราฟ Dynamic - เหมือนเดิม) */}
        <motion.div 
          key={`card4-${selectedFarmId}`} 
          className="bg-white shadow-xl rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <div className="flex flex-col md:flex-row gap-6 items-center">
            
            {/* (กราฟ - เหมือนเดิม) */}
            <motion.div 
              key={`pie-${selectedFarmId}`} 
              className="flex-shrink-0 mx-auto"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 150 }}
            >
              <div 
                className="w-48 h-48 rounded-full"
                style={{ 
                  background: gradientString ? `conic-gradient(from -90deg, ${gradientString})` : '#e5e7eb'
                }}
              >
                {pieSegments.length === 0 && (
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-center text-gray-500 text-sm p-4">
                    ไม่มีข้อมูล (6 เดือนล่าสุด)
                  </div>
                )}
              </div>
            </motion.div>

            {/* (Legend - เหมือนเดิม) */}
            <motion.div 
              key={`legend-${selectedFarmId}`} 
              className="flex-1 w-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="mb-4 space-y-2 max-h-40 overflow-y-auto pr-2">
                {pieSegments.length > 0 ? pieSegments.map((seg, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span 
                      className="w-4 h-4 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: seg.color }}
                    ></span>
                    <span className="text-sm">
                      {seg.name} - {formatNum(seg.kg, 0)} กก. ({formatNum(seg.percent, 2)}%)
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">ไม่มีข้อมูลผลผลิตใน 6 เดือนล่าสุด</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-800">
                  เคล็ดลับ:
                </p>
                <p className="text-sm text-gray-600">
                  ข้อมูลนี้สรุปจากรายการที่บันทึกย้อนหลัง 6 เดือน
                  ลองเปรียบเทียบมูลค่าระหว่าง "ราคากลาง" และ "ราคาที่ขายได้จริง"
                  เพื่อดูประสิทธิภาพการขายของคุณ
                </p>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </main>

      <Footer />
      
      {/* (Modal สำหรับ Error - เหมือนเดิม) */}
      <AlertModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
      />
    </div>
  );
}