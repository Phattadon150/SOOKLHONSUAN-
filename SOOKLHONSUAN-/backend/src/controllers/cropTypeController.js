const pool = require('../db');

const getCropTypes = async (req, res) => {
  console.log('--- [CropTypeController: getCropTypes] เริ่มต้น ---');
  try {
    console.log('[CropType: getAll] กำลังดึงข้อมูลชนิดพืชทั้งหมด...');
    const { rows } = await pool.query(
      'SELECT id, name, description FROM crop_types ORDER BY id ASC'
    );
    console.log(`[CropType: getAll] พบชนิดพืช ${rows.length} รายการ`);
    res.json(rows);

  } catch (err) {
    console.error('--- [CropTypeController: getCropTypes] เกิดข้อผิดพลาด ---');
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getCropTypes };
