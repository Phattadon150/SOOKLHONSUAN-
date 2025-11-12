const pool = require('../db');
const { getProvinceAvgYield } = require('../utils/provinceAvg');

// function ageFactor(ageYears) { ... }
// function careFactor(care) { ... }
// function monthFactor(harvestMonth) { ... }

async function computeFromProvince({ crop_type_id, province, area_rai }) {
  const avg = await getProvinceAvgYield({ crop_type_id, province });
  if (avg == null) return null;

  const area = Number(area_rai);
  const safeArea = Number.isFinite(area) && area > 0 ? area : 0;

  const est = Math.round(safeArea * Number(avg));
  return { estimated: est, baseline_avg_per_rai: Number(avg) };
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

    if (est == null) {
      const r = await computeFromProvince({
        crop_type_id,
        province: location,
        area_rai
      });
      if (!r) return res.status(404).json({ error: `No average yield for province "${location}"` });
      est = r.estimated;
      baseline = r.baseline_avg_per_rai;
    }

    return res.json({
      preview: true,
      input: { farm_id, crop_type_id, calc_date, location, area_rai, tree_age_avg, quality, harvest_month },
      result: { estimated_yield: est, baseline_avg_per_rai: baseline }
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
        area_rai
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
