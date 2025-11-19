// controllers/calculation.Controller.js

const pool = require('../db');
const { getProvinceAvgYield } = require('../utils/provinceAvg');
const { getProvinceMonthlyPattern } = require('../utils/monthlyPattern');

// ================== HELPERS ==================
function ageFactor(ageYears) {
  const a = Number(ageYears);
  let factor = 0.6; 
  if (!Number.isFinite(a) || a <= 0)  factor = 0.6;
  else if (a < 3)   factor = 0.8;
  else if (a <= 8)  factor = 1.0;
  else if (a <= 15) factor = 0.95;
  else              factor = 0.85;
  return factor;
}

function careFactor(quality) {
  let factor = 1.0; 
  if (!quality) return factor;
  const q = String(quality).toLowerCase().trim();
  if (['ดีมาก', 'ดี', 'high', 'good', '1'].includes(q)) factor = 1.1;
  else if (['ปานกลาง', 'กลาง', 'medium', '2'].includes(q)) factor = 1.0;
  else if (['ต่ำ', 'แย่', 'low', 'poor', '3'].includes(q)) factor = 0.85;
  else {
    const num = Number(quality);
    if (Number.isFinite(num)) {
      if (num >= 4) factor = 1.1;
      else if (num >= 2) factor = 1.0;
      else factor = 0.85;
    }
  }
  return factor;
}

function seasonFactorFromPattern(pattern, harvest_month) {
  if (!harvest_month) return { factor: 1.0, monthPercent: null };
  const idx = Number(harvest_month) - 1;
  if (!Array.isArray(pattern) || pattern.length < 12) {
    return { factor: 1.0, monthPercent: null };
  }
  const monthPct = Number(pattern[idx] || 0);
  const peakPct = Math.max(...pattern.map(p => Number(p || 0)));
  if (!monthPct || monthPct <= 0 || !peakPct || peakPct <= 0) {
    return { factor: 0, monthPercent: 0 };
  }
  const ratio = monthPct / peakPct;
  const factor = 0.7 + 0.3 * ratio;
  return {
    factor: Number(factor.toFixed(3)),
    monthPercent: monthPct
  };
}

// ================== CORE: คำนวณผลผลิต ==================
async function computeFromProvince({
  crop_type_id, province, area_rai, harvest_month, tree_age_avg, quality
}) {
  // (ตัด Log เพื่อความกระชับ แต่ฟังก์ชันทำงานเหมือนเดิม)
  const avg = await getProvinceAvgYield({ crop_type_id, province });
  if (avg == null) return null;

  const area = Number(area_rai);
  const safeArea = Number.isFinite(area) && area > 0 ? area : 0;
  const fAge = ageFactor(tree_age_avg);
  const fCare = careFactor(quality);
  const effectivePerRai = Number(avg) * fAge * fCare;
  const baseYield = safeArea * effectivePerRai;

  if (!harvest_month) {
    return {
      estimated: Math.round(baseYield),
      baseline_avg_per_rai: Number(avg),
      effective_yield_per_rai: Number(effectivePerRai.toFixed(2)),
      yearly_estimated: Math.round(baseYield),
      monthly_percent: null,
      season_factor: 1.0, age_factor: fAge, care_factor: fCare, note: null
    };
  }

  const pattern = await getProvinceMonthlyPattern({ crop_type_id, province });
  const { factor: fSeason, monthPercent } = seasonFactorFromPattern(pattern, harvest_month);

  if (fSeason === 0) {
    return {
      estimated: 0,
      baseline_avg_per_rai: Number(avg),
      effective_yield_per_rai: Number(effectivePerRai.toFixed(2)),
      yearly_estimated: Math.round(baseYield),
      monthly_percent: monthPercent, season_factor: fSeason, age_factor: fAge, care_factor: fCare,
      note: `Out of season for month ${harvest_month} in province "${province}"`
    };
  }

  const estSeasonal = baseYield * fSeason;
  return {
    estimated: Math.round(estSeasonal),
    baseline_avg_per_rai: Number(avg),
    effective_yield_per_rai: Number(effectivePerRai.toFixed(2)),
    yearly_estimated: Math.round(baseYield),
    monthly_percent: monthPercent,
    season_factor: fSeason, age_factor: fAge, care_factor: fCare, note: null
  };
}

// ===== PREVIEW: คำนวณอย่างเดียว ไม่บันทึก =====
const previewCalculation = async (req, res) => {
  console.log('--- [CalcController: previewCalculation] ---');
  try {
    // 🛡️ SAFE GUARD: รองรับทั้ง id และ userId
    const userId = req.user?.id || req.user?.userId;
    
    if (!userId) return res.status(401).json({ error: 'User ID not found (Unauthorized)' });

    const body = req.body || {};
    const { farm_id, crop_type_id, location } = body;

    if (!farm_id || !crop_type_id || !location) {
      return res.status(400).json({ error: 'farm_id, crop_type_id และ location (จังหวัด) จำเป็น' });
    }

    const f = await pool.query('SELECT 1 FROM farms WHERE id=$1 AND user_id=$2', [farm_id, userId]);
    if (!f.rows.length) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    let est = body.estimated_yield;
    let resultPayload = {};

    if (est == null) {
      const r = await computeFromProvince({ ...body, province: location });
      if (!r) {
        return res.status(404).json({ error: `No average yield for province "${location}"` });
      }
      est = r.estimated;
      resultPayload = {
        baseline_avg_per_rai: r.baseline_avg_per_rai,
        effective_yield_per_rai: r.effective_yield_per_rai,
        yearly_estimated: r.yearly_estimated,
        monthly_percent: r.monthly_percent,
        season_factor: r.season_factor,
        age_factor: r.age_factor,
        care_factor: r.care_factor,
        note: r.note
      };
    }

    return res.json({
      preview: true,
      input: body,
      result: { estimated_yield: est, ...resultPayload }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

// ===== CREATE: บันทึกจริง =====
const createCalculation = async (req, res) => {
  console.log('--- [CalcController: createCalculation] ---');
  try {
    // 🛡️ SAFE GUARD
    const userId = req.user?.id || req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'User ID not found' });

    const {
      farm_id, crop_type_id, location, area_rai,
      tree_age_avg, quality, harvest_month,
      calc_date, estimated_yield, actual_yield
    } = req.body || {};

    if (!farm_id || !crop_type_id || !location) {
      return res.status(400).json({ error: 'farm_id, crop_type_id และ location จำเป็น' });
    }

    const f = await pool.query('SELECT 1 FROM farms WHERE id=$1 AND user_id=$2', [farm_id, userId]);
    if (!f.rows.length) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    let est = estimated_yield;
    if (est == null) {
      const r = await computeFromProvince({
        crop_type_id, province: location, area_rai, harvest_month, tree_age_avg, quality
      });
      if (!r) {
        return res.status(404).json({ error: `No average yield for province "${location}"` });
      }
      est = r.estimated;
    }

    const safeActualYield = (typeof actual_yield === 'number') ? actual_yield : null;
    
    const { rows } = await pool.query(
      `INSERT INTO calculations
        (farm_id, crop_id, crop_type_id, calc_date, location, area_rai,
         estimated_yield, actual_yield, condition, harvest_month, tree_age_avg, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, $10, $11, NOW())
       RETURNING *`,
      [
        farm_id, null, crop_type_id, calc_date || null, location, area_rai || null,
        est, safeActualYield, quality || null, harvest_month || null, tree_age_avg || null
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

// ===== GET ALL =====
const getCalculationsByUser = async (req, res) => {
  console.log('--- [CalcController: getCalculationsByUser] ---');
  try {
    // 🛡️ SAFE GUARD: หัวใจสำคัญของการแก้ปัญหานี้
    const userId = req.user?.id || req.user?.userId;
    
    console.log(`[Calc: getAll] UserID from token: ${userId}`);

    if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
    }

    const { rows } = await pool.query(
      `SELECT 
         c.id, c.farm_id, c.location, c.area_rai, c.estimated_yield, 
         c.actual_yield, c.condition AS quality, c.harvest_month, c.calc_date,
         f.name AS farm_name,
         ct.name AS crop_name
       FROM calculations c
       JOIN farms f ON c.farm_id = f.id
       LEFT JOIN crop_types ct ON c.crop_type_id = ct.id
       WHERE f.user_id = $1
       ORDER BY c.calc_date DESC, c.created_at DESC`,
      [userId]
    );

    console.log(`[Calc: getAll] Found: ${rows.length} items`);
    res.json(rows);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

// ===== DELETE =====
const deleteCalculation = async (req, res) => {
  try {
    // 🛡️ SAFE GUARD
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const calcId = parseInt(id, 10);
    if (isNaN(calcId)) return res.status(400).json({ error: 'Invalid ID' });

    const result = await pool.query(
      `DELETE FROM calculations c
       USING farms f
       WHERE c.farm_id = f.id
         AND c.id = $1
         AND f.user_id = $2`,
      [calcId, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===== UPDATE =====
const updateCalculation = async (req, res) => {
  try {
    // 🛡️ SAFE GUARD
    const userId = req.user?.id || req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { actual_yield, calc_date } = req.body; 
    const calcId = parseInt(id, 10);

    const safeActualYield = Number(actual_yield);
    const safeCalcDate = calc_date ? new Date(calc_date) : new Date();

    const { rows } = await pool.query(
      `UPDATE calculations c
       SET actual_yield = $1, calc_date = $2 
       FROM farms f
       WHERE c.id = $3 AND c.farm_id = f.id AND f.user_id = $4
       RETURNING c.*`,
      [safeActualYield, safeCalcDate, calcId, userId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { 
  previewCalculation, 
  createCalculation,
  getCalculationsByUser,
  deleteCalculation,
  updateCalculation,
};