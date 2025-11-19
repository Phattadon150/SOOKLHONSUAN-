const pool = require('../db');

// ฟังก์ชันช่วยจัดรูปแบบชื่อจังหวัด
function normalizeProvince(p) {
  if (!p) return null;
  return String(p).trim();
}

// Config สำหรับคำนวณเกรด (ถ้ามี)
const GRADE_CONFIG_BY_CROP = {
  1: [ // ลำไย
    { key: 'AA+A', label: 'AA+A', percentage: 0.20, price: 40 },
    { key: 'AA',   label: 'AA',   percentage: 0.20, price: 26 },
    { key: 'A',    label: 'A',    percentage: 0.20, price: 10 },
    { key: 'B',    label: 'B',    percentage: 0.20, price: 6  },
    { key: 'C',    label: 'C',    percentage: 0.20, price: 1  }
  ],
};

// ฟังก์ชันคำนวณรายได้แยกเกรด
function calculateGradeRevenue(totalKg, crop_type_id) {
  const total = Number(totalKg || 0);
  const cid = Number(crop_type_id || 1);

  if (!Number.isFinite(total) || total <= 0) return null;

  const config = GRADE_CONFIG_BY_CROP[cid];
  if (!config) return null;

  const grades = {};
  let sum = 0;

  for (const g of config) {
    const kg = +(total * g.percentage).toFixed(2);
    const revenue = +(kg * g.price).toFixed(2);

    grades[g.key] = {
      label: g.label,
      kg,
      price_per_kg: g.price,
      revenue
    };

    sum += revenue;
  }

  return {
    total_yield_kg: total,
    grades,
    total_revenue: +sum.toFixed(2)
  };
}

// ⭐️ ฟังก์ชันใหม่: ดึงราคาทั้งหมด (สำหรับหน้า Dashboard)
async function fetchAllLatestPrices() {
  // เลือกราคาล่าสุดของแต่ละ crop_type_id
  const query = `
    SELECT DISTINCT ON (crop_type_id)
      id, crop_type_id, province, price_avg, unit, effective_date, source
    FROM market_prices
    ORDER BY crop_type_id, effective_date DESC;
  `;
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching all prices:', error);
    return [];
  }
}

// ฟังก์ชันเดิม: ดึงราคาเจาะจง (ตาม ID และจังหวัด)
async function fetchLatestCentralPrice({ crop_type_id, province }) {
  const cid = Number(crop_type_id || 1);
  const prov = normalizeProvince(province);

  if (!cid) {
    throw new Error('crop_type_id is required');
  }

  let row = null;

  // 1. หาแบบตรงจังหวัด
  if (prov) {
    const r1 = await pool.query(
      `SELECT *
       FROM market_prices
       WHERE crop_type_id = $1 AND province = $2
       ORDER BY effective_date DESC
       LIMIT 1`,
      [cid, prov]
    );
    row = r1.rows[0] || null;
  }

  // 2. ถ้าไม่เจอ ให้หาราคาทั่วไป (province IS NULL)
  if (!row) {
    const r2 = await pool.query(
      `SELECT *
       FROM market_prices
       WHERE crop_type_id = $1 AND province IS NULL
       ORDER BY effective_date DESC
       LIMIT 1`,
      [cid]
    );
    row = r2.rows[0] || null;
  }

  if (!row) return null;

  return {
    id: row.id,
    crop_type_id: row.crop_type_id,
    province: row.province,
    price_avg: Number(row.price_avg),
    price_min: row.price_min != null ? Number(row.price_min) : null,
    price_max: row.price_max != null ? Number(row.price_max) : null,
    unit: row.unit,
    effective_date: row.effective_date,
    source: row.source
  };
}

// ==========================================
// Controller Methods
// ==========================================

const getLatestPrice = async (req, res) => {
  try {
    const { crop_type_id, province } = req.query;

    // ⭐️ กรณีที่ 1: ถ้าไม่ส่ง crop_type_id มา -> ให้ส่งกลับราคาทุกตัว (แก้ปัญหา 404)
    if (!crop_type_id) {
      const allPrices = await fetchAllLatestPrices();
      return res.json(allPrices);
    }

    // กรณีที่ 2: ถ้าส่ง ID มา -> หาเจาะจง
    const data = await fetchLatestCentralPrice({
      crop_type_id,
      province
    });

    if (!data) {
      return res.status(404).json({ error: 'No market price found' });
    }

    return res.json(data);
  } catch (err) {
    console.error('getLatestPrice error:', err);
    res.status(500).json({ error: err.message });
  }
};

const estimateValue = async (req, res) => {
  try {
    const {
      mode,
      crop_type_id,
      province,
      estimated_yield,
      custom_price
    } = req.body || {};

    const est = Number(estimated_yield || 0);
    if (!est || est <= 0) {
      return res.status(400).json({ error: 'estimated_yield must be > 0' });
    }

    const m = (mode || '').toLowerCase();
    
    // Mode: Market Price
    if (m === 'market') {
      const central = await fetchLatestCentralPrice({ crop_type_id, province });
      
      if (!central) {
        return res.status(404).json({ error: 'No central market price found' });
      }

      const usedPrice = central.price_avg;
      const totalValue = est * usedPrice;

      const gradeRevenue = calculateGradeRevenue(est, crop_type_id);

      return res.json({
        mode: 'market',
        crop_type_id: crop_type_id ? Number(crop_type_id) : 1,
        province: normalizeProvince(province),
        estimated_yield: est,
        used_price: usedPrice,
        unit: central.unit,
        total_value: totalValue,
        grade_revenue: gradeRevenue,
        central_price: central,
        source: central.source
      });
    }

    // Mode: Custom Price
    const cp = Number(custom_price || 0);
    // อนุญาตให้ราคาเป็น 0 ได้ไหม? ถ้าไม่ได้ให้ uncomment บรรทัดล่าง
    // if (!cp || cp <= 0) return res.status(400).json({ error: 'custom_price must be > 0' });

    const flatTotalValue = +(est * cp).toFixed(2);

    return res.json({
      mode: 'custom',
      crop_type_id: crop_type_id ? Number(crop_type_id) : 1,
      province: normalizeProvince(province),
      total_yield_kg: est,
      price_per_kg: cp,
      total_value: flatTotalValue,
    });

  } catch (err) {
    console.error('estimateValue error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getLatestPrice,
  estimateValue
};