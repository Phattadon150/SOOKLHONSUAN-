const pool = require('../db');

const getCropTypes = async (req, res) => {
  console.log('[API] GET /api/crop-types - Received request'); // 👈 เพิ่ม
  try {
    const { rows } = await pool.query(
      'SELECT id, name, description FROM crop_types ORDER BY id ASC'
    );
    console.log(`✅ [API] GET /api/crop-types - Success: Sent ${rows.length} crop types`); // 👈 เพิ่ม
    res.json(rows);
  } catch (err) {
    console.error(`❌ [API] GET /api/crop-types - Server Error: ${err.message}`); // 👈 เพิ่ม
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getCropTypes };
