// backend/src/utils/provinceAvg.js
const pool = require('../db');

/**
 * ดึงค่าเฉลี่ยผลผลิตต่อไร่ของจังหวัด (หน่วย กก./ไร่)
 * @param {Object} params
 * @param {number} params.crop_type_id - รหัสประเภทพืช (เช่น 1 = ลำไย)
 * @param {string} params.province - ชื่อจังหวัด
 * @returns {number|null} ค่าเฉลี่ย (กก./ไร่) หรือ null ถ้าไม่พบ
 */
async function getProvinceAvgYield({ crop_type_id, province }) {
  try {
    // หาค่าเฉลี่ยรวมหลายปี (year=0)
    const avgRow = await pool.query(
      `SELECT avg_yield_rai
       FROM province_yields
       WHERE crop_type_id=$1 AND province=$2 AND year=0
       LIMIT 1`,
      [crop_type_id, province]
    );

    if (avgRow.rows.length > 0) {
      return Number(avgRow.rows[0].avg_yield_rai);
    }

    // ถ้าไม่มี year=0 ให้คำนวณเฉลี่ยจากปี 2020–2024 (พ.ศ. 2563–2567)
    const avgCalc = await pool.query(
      `SELECT AVG(avg_yield_rai)::float AS avg_yield_rai
       FROM province_yields
       WHERE crop_type_id=$1 AND province=$2 AND year BETWEEN 2020 AND 2024`,
      [crop_type_id, province]
    );

    if (avgCalc.rows[0]?.avg_yield_rai) {
      return Number(avgCalc.rows[0].avg_yield_rai);
    }

    // ไม่พบข้อมูลจังหวัดนี้
    return null;
  } catch (err) {
    console.error('getProvinceAvgYield error:', err);
    return null;
  }
}

module.exports = { getProvinceAvgYield };
