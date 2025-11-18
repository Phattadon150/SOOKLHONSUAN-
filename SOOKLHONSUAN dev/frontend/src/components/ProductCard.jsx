// components/ProductCard.jsx
import React from 'react';

// ⭐️ 1. เพิ่ม 'actual_yield' เข้าไปใน props
export default function ProductCard({ 
  name, 
  area, 
  diff, 
  quality, 
  month, 
  onView, 
  onDelete, 
  estimated_yield,
  actual_yield // 👈 รับ prop ใหม่
}) {
  
  // ( ... ตรรกะสำหรับ diffNum, diffColor, diffSign ... เหมือนเดิม )
  const hasDiff = diff !== null && diff !== undefined;
  const diffNum = parseFloat(diff);
  const isPositive = diffNum > 0;
  const diffColor = hasDiff ? 'text-green-600' : 'text-red-600';
  const diffSign = hasDiff ? (isPositive ? '+' : '') : '';

  // ⭐️ 2. (ใหม่) ตรวจสอบว่ามี 'actual_yield' หรือไม่
  // (เราเช็คว่า 'is finite' และไม่เป็น null/undefined)
  const hasActualYield = Number.isFinite(actual_yield) && actual_yield !== null;

  return (
    <div className="bg-white shadow-lg rounded-xl p-4 mb-3 flex items-center justify-between space-x-4">
      
      {/* --------------------------- */}
      {/* 1. ส่วนข้อมูล (ซ้าย) */}
      {/* --------------------------- */}
      <div className="flex-1 min-w-0">
        <h3 className="text-green-900 font-bold text-lg truncate" title={name}>
          {name}
        </h3>
        
        {/* ⭐️ 3. (แก้ไข) เพิ่ม "ผลผลิตจริง" เข้าไปในข้อมูลย่อย */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
          <span>
            พื้นที่: <strong className="text-gray-900">{area}</strong> ไร่
          </span>
          {/* แสดงผลผลิตที่คาดการณ์ */}
          <span>
            คาดการณ์: <strong className="text-gray-900">
              {Number(estimated_yield).toLocaleString('th-TH', { maximumFractionDigits: 0 }) || '-'}
            </strong> กก.
          </span>

          {/* ⭐️ 4. (ใหม่) แสดงผลผลิตจริง หรือข้อความ "ยังไม่บันทึก" */}
          <span>
            ผลผลิตจริง: 
            {hasActualYield ? (
              <strong className="text-blue-700 ml-1">
                {Number(actual_yield).toLocaleString('th-TH', { maximumFractionDigits: 0 })} กก.
              </strong>
            ) : (
              <span className="text-gray-500 italic ml-1">
                (ยังไม่บันทึกผล)
              </span>
            )}
          </span>

          <span>
            คุณภาพ: <strong className="text-gray-900">{quality}</strong>
          </span>
          <span>
            เดือน: <strong className="text-gray-900">{month}</strong>
          </span>
        </div>
      </div>

      {/* --------------------------- */}
      {/* 2. ส่วนตัวเลขและปุ่ม (ขวา) */}
      {/* --------------------------- */}
      <div className="flex flex-col items-end flex-shrink-0 ml-4">
        
        {/* (ส่วนแสดง % diff เหมือนเดิม) */}
        <div className={`font-bold text-xl mb-2 ${hasDiff ? diffColor : 'text-gray-400'}`}>
          {hasDiff ? `${diffSign}${diffNum.toFixed(0)}%` : 'N/A'}
        </div>
        
        {/* (ปุ่ม 'onView' เหมือนเดิม) */}
        <button
          onClick={onView}
          className="bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md hover:bg-green-800 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          แก้ไข/คำนวณใหม่
        </button>

        {/* (ปุ่ม 'onDelete' เหมือนเดิม) */}
        <button
          onClick={onDelete}
          className="text-red-600 text-xs hover:text-red-800 hover:underline mt-2 focus:outline-none"
        >
          ลบรายการนี้
        </button>
        
      </div>
    </div>
  );
}