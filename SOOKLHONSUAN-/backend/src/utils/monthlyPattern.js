const pool = require('../db');

async function getProvinceMonthlyPattern({ crop_type_id, province }) {
  try {
    const { rows } = await pool.query(
      `SELECT month, percent
       FROM province_monthly
       WHERE crop_type_id=$1 AND province=$2
       ORDER BY month ASC`,
      [crop_type_id, province]
    );

    if (!rows.length) return null;

    const pattern = Array(12).fill(0);
    for (const r of rows) {
      const idx = Number(r.month) - 1;
      if (idx >= 0 && idx < 12) {
        pattern[idx] = Number(r.percent);
      }
    }
    return pattern;
  } catch (err) {
    console.error('getProvinceMonthlyPattern error:', err);
    return null;
  }
}

module.exports = { getProvinceMonthlyPattern };
