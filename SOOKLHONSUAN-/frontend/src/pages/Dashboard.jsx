import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- 1. เพิ่ม State สำหรับเก็บชื่อพืชผล (สำหรับสร้างแท่งกราฟ) ---
const [cropNames, setCropNames] = useState([]);

// --- 2. เพิ่มฟังก์ชันสำหรับกำหนดสี (เพื่อให้แต่ละพืชมีสีต่างกัน) ---
const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f97316", "#8b5cf6", "#ec4899"];
const getColor = (index) => COLORS[index % COLORS.length];


export default function Dashboard() {
  const navigate = useNavigate();

  const [calculations, setCalculations] = useState([]);
  const [graphData, setGraphData] = useState([]);
  
  // --- 1. (เพิ่ม) State สำหรับเก็บชื่อพืชผล ---
  const [cropNames, setCropNames] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 2. (เพิ่ม) ฟังก์ชันสี ---
  const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f97316", "#8b5cf6", "#ec4899"];
  const getColor = (index) => COLORS[index % COLORS.length];

  useEffect(() => {
    const fetchCalculations = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:4000/api/calculations", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "ไม่สามารถดึงข้อมูลได้");
        }

        const data = await response.json();
        setCalculations(data); //  <-- อัปเดต State สำหรับ List (เหมือนเดิม)

        // --- 3. (แก้ไข) เริ่มต้นการแปลงข้อมูลสำหรับกราฟ (แบบใหม่) ---

        // 3.1. สร้าง Map สำหรับเก็บข้อมูล 6 เดือนย้อนหลัง
        const monthMap = new Map();
        const allCropNames = new Set(); // Set สำหรับเก็บชื่อพืชทั้งหมดที่พบ
        const today = new Date();
        const monthLabels = []; // Array สำหรับเก็บ "YYYY-MM" 6 เดือน

        for (let i = 0; i < 6; i++) {
          // สร้าง Date object สำหรับเดือนที่ i (0=ปัจจุบัน, 1=เดือนที่แล้ว, ...)
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          // แปลงเป็น "YYYY-MM"
          const label = d.toISOString().substring(0, 7); 
          
          monthLabels.push(label);
          // สร้าง object เริ่มต้นสำหรับเดือนนั้นๆ
          monthMap.set(label, { name: label }); 
        }

        // 3.2. วนลูปข้อมูล (data) เพื่อกรองและรวมยอด
        for (const calc of data) {
          // ตรวจสอบว่ามีข้อมูล 'calc_date', 'crop_name', และ 'actual_yield'
          if (!calc.calc_date || !calc.crop_name || calc.actual_yield == null) {
            continue; // ข้ามถ้าข้อมูลไม่ครบ
          }

          const calcDate = new Date(calc.calc_date);
          const calcMonthLabel = calcDate.toISOString().substring(0, 7);

          // ตรวจสอบว่าข้อมูลนี้อยู่ใน 6 เดือนที่เราสนใจหรือไม่
          if (monthMap.has(calcMonthLabel)) {
            const cropName = calc.crop_name; // <-- (สำคัญ) สมมติว่า API ส่ง 'crop_name' มา
            allCropNames.add(cropName); // เพิ่มชื่อพืชลงใน Set
            
            const monthData = monthMap.get(calcMonthLabel);

            // รวมยอด 'ผลผลิตที่ได้จริง' (actual_yield)
            if (!monthData[cropName]) {
              monthData[cropName] = 0;
            }
            monthData[cropName] += calc.actual_yield;
          }
        }

        // 3.3. สร้าง Array ข้อมูลกราฟ และอัปเดต State
        
        // เรียงลำดับเดือนจากเก่าไปใหม่
        const sortedMonthLabels = monthLabels.reverse(); // ["2025-06", ..., "2025-11"]
        
        const formattedGraphData = sortedMonthLabels.map(label => monthMap.get(label));
        
        setGraphData(formattedGraphData);
        setCropNames(Array.from(allCropNames)); // อัปเดต State ชื่อพืช
        
        // --- สิ้นสุดการแก้ไขส่วนแปลงข้อมูล ---

      } catch (err) {
        // (สำคัญ) แจ้งเตือนหาก API ไม่ได้ส่ง 'crop_name' มา
        if (err instanceof TypeError && err.message.includes('crop_name')) {
           setError("ข้อมูลที่ได้รับจาก API ไม่มี 'crop_name' จึงไม่สามารถสร้างกราฟชนิดใหม่ได้");
        } else {
           setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalculations();
  }, [navigate]);


  // --- ฟังก์ชัน renderContent (List) ... (เหมือนเดิม) ... ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="bg-white shadow rounded-xl p-6 text-center text-gray-500">
          กำลังโหลดข้อมูลการคำนวณ...
        </div>
      );
    }
    if (error) {
      return (
        <div className="bg-white shadow rounded-xl p-6 text-center text-red-500">
          เกิดข้อผิดพลาด: {error}
        </div>
      );
    }
    if (calculations.length === 0) {
      return (
        <div className="bg-white shadow rounded-xl p-6 text-center text-gray-500">
          ยังไม่มีข้อมูลการคำนวณ
        </div>
      );
    }

    // วนลูปแสดง "ผลการคำนวณ"
    return calculations.map((calc) => {
      let diffPercent = null;
      if (calc.actual_yield != null && calc.estimated_yield > 0) {
        const diff = calc.actual_yield - calc.estimated_yield;
        diffPercent = ((diff / calc.estimated_yield) * 100).toFixed(0);
      }
      
      return (
        <ProductCard
          key={calc.id}
          name={`${calc.farm_name} (จ. ${calc.location})`}
          area={calc.area_rai ? calc.area_rai.toFixed(2) : '-'}
          quality={calc.quality || '-'}
          month={calc.harvest_month || '-'}
          diff={diffPercent} // 👈 % ส่วนต่าง
          onView={() => {
            const dataForSummary = { 
              preview: false, 
              input: {
                farm_id: calc.farm_id,
                crop_type_id: calc.crop_type_id,
                location: calc.location,
                area_rai: calc.area_rai,
                quality: calc.quality,
                harvest_month: calc.harvest_month,
                tree_age_avg: calc.tree_age_avg,
                calc_date: calc.calc_date,
              },
              result: calc 
            };
            navigate(`/farm/${calc.farm_id}/summary`, { state: { calculationData: dataForSummary } });
          }}
        />
      );
    });
  };


  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 p-4">
        {/* ... (h1, p ... เหมือนเดิม) ... */}

        {/* --- 4. (แก้ไข) ส่วนกราฟ --- */}
        <div className="bg-white shadow-md rounded-xl p-6 mb-4">
          
          <h2 className="text-center text-green-900 font-semibold mb-3">
            สรุปผลผลิตจริง 6 เดือนล่าสุด (แบ่งตามชนิดพืช)
          </h2>

          <div className="h-72 w-full min-w-[300px] min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              {/* 4.1. เปลี่ยน title และข้อมูล */}
              <BarChart data={graphData}> 
                <CartesianGrid strokeDasharray="3 3" />
                {/* 4.2. XAxis "name" ตอนนี้คือ "YYYY-MM" */}
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                
                {/* 4.3. (สำคัญ) สร้างแท่ง <Bar> แบบไดนามิกตาม 'cropNames' */}
                {cropNames.map((crop, index) => (
                  <Bar 
                    key={crop} 
                    dataKey={crop} // dataKey คือชื่อพืช (เช่น "ลำไย", "มะม่วง")
                    fill={getColor(index)} // กำหนดสีให้ต่างกัน
                    stackId="a" // (ทางเลือก) ถ้าอยากให้เป็นแท่งซ้อนกัน ให้ใส่ stackId
                               // ถ้าอยากให้เป็นแท่งข้างกัน (Grouped) ให้ลบบรรทัด stackId="a"
                  />
                ))}
                
                {/* (ลบแท่ง <Bar> แบบคงที่ 2 อันเดิมออก) */}
                {/* <Bar dataKey="ผลผลิตที่ได้จริง" fill="#ef4444" /> */}
                {/* <Bar dataKey="ผลผลิตที่คาดหวัง" fill="#10b981" /> */}

              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- 5. ส่วนประวัติ (List) (เหมือนเดิม) --- */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-green-900 font-semibold">ผลการคำนวณล่าสุด</h2>
          <button
            onClick={() => navigate("/farmform")}
            className="text-sm bg-green-700 text-white px-3 py-1 rounded-full shadow hover:bg-green-800 transition"
          >
            + เพิ่มสวน
          </button>
        </div>

        <div className="space-y-3">{renderContent()}</div>
      </main>
      <Footer />
    </div>
  );
}