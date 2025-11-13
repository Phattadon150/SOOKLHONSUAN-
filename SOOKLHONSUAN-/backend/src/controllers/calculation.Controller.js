const pool = require('../db');
const { getProvinceAvgYield } = require('../utils/provinceAvg');
const { getProvinceMonthlyPattern } = require('../utils/monthlyPattern');

// function ageFactor(ageYears) { ... }
// function careFactor(care) { ... }
// function monthFactor(harvestMonth) { ... }

async function computeFromProvince({ crop_type_id, province, area_rai, harvest_month }) {
  const avg = await getProvinceAvgYield({ crop_type_id, province });
  if (avg == null) return null;

  const area = Number(area_rai);
  const safeArea = Number.isFinite(area) && area > 0 ? area : 0;

  const base = safeArea * Number(avg);

  if (!harvest_month) {
    const est = Math.round(base);
    return {
      estimated: est,
      baseline_avg_per_rai: Number(avg),
      yearly_estimated: est,
      monthly_percent: null,
      season_factor: 1.0,
      note: null
    };
  }

  const pattern = await getProvinceMonthlyPattern({ crop_type_id, province });

  if (!pattern || !pattern.length) {
    const est = Math.round(base);
    return {
      estimated: est,
      baseline_avg_per_rai: Number(avg),
      yearly_estimated: est,
      monthly_percent: null,
      season_factor: 1.0,
      note: `No monthly pattern for province "${province}", using base yield`
    };
  }

  const monthIndex = Number(harvest_month) - 1;
  const pct = pattern[monthIndex] || 0;
  const peakPct = Math.max(...pattern);

  if (!pct || pct <= 0 || !peakPct || peakPct <= 0) {
    return {
      estimated: 0,
      baseline_avg_per_rai: Number(avg),
      yearly_estimated: Math.round(base),
      monthly_percent: 0,
      season_factor: 0,
      note: `Province "${province}" has 0% yield in month ${harvest_month} (out of season)`
    };
  }

  const ratio = pct / peakPct;
  const factor = 0.7 + 0.3 * ratio; 

  const estSeasonal = base * factor;

  return {
    estimated: Math.round(estSeasonal),
    baseline_avg_per_rai: Number(avg),
    yearly_estimated: Math.round(base),
    monthly_percent: pct,            
    season_factor: Number(factor.toFixed(3)),
    note: null
  };
}

// ===== PREVIEW: คำนวณอย่างเดียว ไม่บันทึก =====
const previewCalculation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      farm_id, crop_type_id, location, area_rai,
      // เก็บค่าไว้เฉย ๆ แต่ยังไม่คูณ
      tree_age_avg, quality, harvest_month,
      calc_date, estimated_yield
    } = req.body || {};

    if (!farm_id || !crop_type_id || !location) {
      return res.status(400).json({ error: 'farm_id, crop_type_id และ location (จังหวัด) จำเป็น' });
    }

    // ฟาร์มต้องเป็นของ user
    const f = await pool.query('SELECT 1 FROM farms WHERE id=$1 AND user_id=$2', [farm_id, userId]);
    if (!f.rows.length) return res.status(404).json({ error: 'Farm not found' });

    let est = estimated_yield;
    let baseline = null;
    let yearly_estimated = null;
    let monthly_percent = null;
    let season_factor = null;
    let note = null;

    if (est == null) {
      const r = await computeFromProvince({
        crop_type_id,
        province: location,
        area_rai,
        harvest_month
      });
      if (!r) return res.status(404).json({ error: `No average yield for province "${location}"` });

      est = r.estimated;
      baseline = r.baseline_avg_per_rai;
      yearly_estimated = r.yearly_estimated;
      monthly_percent = r.monthly_percent;
      season_factor = r.season_factor ?? null;
      note = r.note;
    }

    return res.json({
      preview: true,
      input: { farm_id, crop_type_id, calc_date, location, area_rai, tree_age_avg, quality, harvest_month },
      result: {
        // ผลผลิตรอบนี้
        estimated_yield: est,

        // ข้อมูลประกอบ
        baseline_avg_per_rai: baseline,
        yearly_estimated,
        monthly_percent,
        season_factor,
        note
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ===== CREATE: บันทึกจริง =====
const createCalculation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      farm_id, crop_type_id, location, area_rai,
      tree_age_avg, quality, harvest_month,
      calc_date, estimated_yield, actual_yield
    } = req.body || {};

    if (!farm_id || !crop_type_id || !location) {
      return res.status(400).json({ error: 'farm_id, crop_type_id และ location (จังหวัด) จำเป็น' });
    }

    const f = await pool.query('SELECT 1 FROM farms WHERE id=$1 AND user_id=$2', [farm_id, userId]);
    if (!f.rows.length) return res.status(404).json({ error: 'Farm not found' });

    let est = estimated_yield;
    if (est == null) {
      const r = await computeFromProvince({
        crop_type_id,
        province: location,
        area_rai,
        harvest_month
      });
      if (!r) return res.status(404).json({ error: `No average yield for province "${location}"` });
      est = r.estimated;
    }

    const { rows } = await pool.query(
      `INSERT INTO calculations
        (farm_id, crop_id, crop_type_id, calc_date, location, area_rai,
         estimated_yield, actual_yield, condition, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
       RETURNING id, farm_id, crop_type_id, calc_date, location, area_rai,
                 estimated_yield, actual_yield, condition, created_at`,
      [
        farm_id,
        null, // ยังไม่ใช้ crop_id
        crop_type_id,
        calc_date || null,
        location,
        area_rai || null,
        est,
        (typeof actual_yield === 'number') ? actual_yield : null,
        quality || null
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { previewCalculation, createCalculation };
