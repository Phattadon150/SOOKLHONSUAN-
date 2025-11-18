// components/FarmCard.jsx

import React from 'react';

// ⭐️ นี่คือ Component ใหม่ที่แสดงข้อมูล "สวน" (Farm)
export default function FarmCard({ farm, onAddNew, onViewHistory, onDeleteFarm }) {
  const { farm_id, farm_name, location, crop_name, calculation_count, latest_calc_date } = farm;

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-transform duration-200 hover:shadow-xl hover:-translate-y-1">
      <div>
        {/* === ส่วนหัวการ์ด === */}
        <h3 className="text-xl font-bold text-green-900 truncate" title={farm_name}>
          {farm_name}
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          {location} | {crop_name || 'ไม่ระบุพืช'}
        </p>

        {/* === สรุปข้อมูล === */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">จำนวนการบันทึก:</span>
            <span className="font-semibold text-gray-800">{calculation_count} ครั้ง</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">บันทึกครั้งล่าสุด:</span>
            <span className="font-semibold text-gray-800">
              {latest_calc_date ? new Date(latest_calc_date).toLocaleDateString('th-TH') : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* === ⭐️ 3. (ใหม่) ปุ่มสำหรับจัดการฟาร์ม ⭐️ === */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onAddNew(farm_id)}
          className="w-full bg-green-700 text-white font-semibold px-4 py-2 rounded-full shadow-md hover:bg-green-800 transition"
        >
          + เพิ่มการบันทึก
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onViewHistory(farm_id)}
            className="w-1/2 text-sm text-green-700 border border-green-700 rounded-full py-1 hover:bg-green-50 transition"
          >
            ดูประวัติ
          </button>
          <button
            onClick={() => onDeleteFarm(farm_id, farm_name)}
            className="w-1/2 text-sm text-red-600 border border-red-600 rounded-full py-1 hover:bg-red-50 transition"
          >
            ลบสวนนี้
          </button>
        </div>
      </div>
    </div>
  );
}