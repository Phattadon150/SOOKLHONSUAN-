const pool = require('../db');

function normalizeProvince(p) {
  if (!p) return null;
  return String(p).trim();
}

// ดึงราคากลางล่าสุดจากตาราง market_prices
async function fetchLatestCentralPrice({ crop_type_id, province }) {
  const cid = Number(crop_type_id || 1);
  const prov = normalizeProvince(province);

  if (!cid) {
    throw new Error('crop_type_id is required');
  }

  let row = null;

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

  // ถ้าไม่เจอใช้ราคาทั่วประเทศ
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

const getLatestPrice = async (req, res) => {
  try {
    const data = await fetchLatestCentralPrice({
      crop_type_id: req.query.crop_type_id,
      province: req.query.province
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
    if (!['market', 'custom'].includes(m)) {
      return res.status(400).json({ error: 'mode must be "market" or "custom"' });
    }

    // ดึงราคากลางล่าสุด (ไว้ใช้ทั้งสองโหมด)
    const central = await fetchLatestCentralPrice({ crop_type_id, province });

    if (m === 'market') {
      if (!central) {
        return res.status(404).json({ error: 'No central market price found' });
      }

      const usedPrice = central.price_avg;
      const totalValue = est * usedPrice;

      return res.json({
        mode: 'market',
        crop_type_id: crop_type_id ? Number(crop_type_id) : 1,
        province: normalizeProvince(province),
        estimated_yield: est,
        used_price: usedPrice,
        unit: central.unit,
        total_value: totalValue,
        central_price: central,
        source: central.source
      });
    }

    // mode === 'custom'
    const cp = Number(custom_price || 0);
    if (!cp || cp <= 0) {
      return res.status(400).json({ error: 'custom_price must be > 0 when mode="custom"' });
    }

    const totalValue = est * cp;

    let diffFromCentral = null;
    let centralAvg = null;
    if (central && typeof central.price_avg === 'number') {
      centralAvg = central.price_avg;
      diffFromCentral = cp - centralAvg; // + = สูงกว่าราคากลาง, - = ต่ำกว่า
    }

    return res.json({
      mode: 'custom',
      crop_type_id: crop_type_id ? Number(crop_type_id) : 1,
      province: normalizeProvince(province),
      estimated_yield: est,
      used_price: cp,
      unit: central?.unit || 'THB/kg',
      total_value: totalValue,
      central_price_avg: centralAvg,
      diff_from_central: diffFromCentral,
      central_price: central
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
