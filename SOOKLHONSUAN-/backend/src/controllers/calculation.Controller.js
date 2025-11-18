const pool = require('../db');
const { getProvinceAvgYield } = require('../utils/provinceAvg');
const { getProvinceMonthlyPattern } = require('../utils/monthlyPattern');

// ================== HELPERS ==================

// ปัจจัยอายุของต้นลำไย (ปี)
function ageFactor(ageYears) {
  const a = Number(ageYears);
  if (!Number.isFinite(a) || a <= 0) return 0.6;   // ยังเล็กมากๆหรือไม่รู้ข้อมูล

  if (a < 3)  return 0.8;   // ยังไม่เต็มที่
  if (a <= 8) return 1.0;   // ช่วงพีค
  if (a <= 15) return 0.95; // เริ่มนิ่ง
  return 0.85;              // อายุเยอะ ผลผลิตเริ่มตก
}

// ปัจจัยการดูแล / คุณภาพสวน
function careFactor(quality) {
  if (!quality) return 1.0;

  const q = String(quality).toLowerCase().trim();

  if (['ดีมาก', 'ดี', 'high', 'good', '1'].includes(q)) return 1.1; // ดูแลดี
  if (['ปานกลาง', 'กลาง', 'medium', '2'].includes(q)) return 1.0; // ปกติ
  if (['ต่ำ', 'แย่', 'low', 'poor', '3'].includes(q)) return 0.85;  // ดูแลน้อย

  const num = Number(quality);
  if (Number.isFinite(num)) {
    if (num >= 4) return 1.1;
    if (num >= 2) return 1.0;
    return 0.85;
  }

  return 1.0; // อ่านค่าไม่ออก -> ไม่ปรับ
}

// map จากสัดส่วนเดือน (0–peak) -> factor 0.7–1.0
function seasonFactorFromPattern(pattern, harvest_month) {
  if (!harvest_month) return { factor: 1.0, monthPercent: null };

  const idx = Number(harvest_month) - 1;
  if (!Array.isArray(pattern) || pattern.length < 12) {
    return { factor: 1.0, monthPercent: null };
  }

  const monthPct = Number(pattern[idx] || 0);
  const peakPct = Math.max(...pattern.map(p => Number(p || 0)));

  // นอกฤดูจริงๆ
  if (!monthPct || monthPct <= 0 || !peakPct || peakPct <= 0) {
    return { factor: 0, monthPercent: 0 };
  }

  const ratio = monthPct / peakPct;  // 0–1
  const factor = 0.7 + 0.3 * ratio;  // 0.7–1.0

  return {
    factor: Number(factor.toFixed(3)),
    monthPercent: monthPct
  };
}

// ================== CORE: คำนวณผลผลิต ==================
async function computeFromProvince({
  crop_type_id,
  province,
  area_rai,
  harvest_month,
  tree_age_avg,
  quality
}) {
  // ค่าเฉลี่ยจังหวัดต่อไร่ (กก./ไร่)
  const avg = await getProvinceAvgYield({ crop_type_id, province });
  if (avg == null) return null;

  const area = Number(area_rai);
  const safeArea = Number.isFinite(area) && area > 0 ? area : 0;

  // ปรับตามอายุ + การดูแล
  const fAge = ageFactor(tree_age_avg);
  const fCare = careFactor(quality);

  const effectivePerRai = Number(avg) * fAge * fCare;

  // คูณพื้นที่ -> ผลผลิตพื้นฐานของสวน (รอบหลัก, ยังไม่ปรับฤดูกาล)
  const baseYield = safeArea * effectivePerRai;  // กก.

  // ถ้าไม่เลือกเดือน -> ไม่ปรับฤดูกาล
  if (!harvest_month) {
    const est = Math.round(baseYield);
    return {
      estimated: est,
      baseline_avg_per_rai: Number(avg),
      effective_yield_per_rai: Number(effectivePerRai.toFixed(2)),
      yearly_estimated: est,
      monthly_percent: null,
      season_factor: 1.0,
      age_factor: fAge,
      care_factor: fCare,
      note: null
    };
  }

  // ถ้ามีเดือน -> ใช้ pattern รายเดือนของจังหวัด
  const pattern = await getProvinceMonthlyPattern({ crop_type_id, province });
  const { factor: fSeason, monthPercent } =
    seasonFactorFromPattern(pattern, harvest_month);

  // เดือนที่นอกฤดู -> ผลผลิต 0
  if (fSeason === 0) {
    return {
      estimated: 0,
      baseline_avg_per_rai: Number(avg),
      effective_yield_per_rai: Number(effectivePerRai.toFixed(2)),
      yearly_estimated: Math.round(baseYield),
      monthly_percent: monthPercent,
      season_factor: fSeason,
      age_factor: fAge,
      care_factor: fCare,
      note: `Out of season for month ${harvest_month} in province "${province}"`
    };
  }

  // ปรับฤดูกาล
  const estSeasonal = baseYield * fSeason;

  return {
    estimated: Math.round(estSeasonal),          // ผลผลิตที่คาด "รอบนี้"
    baseline_avg_per_rai: Number(avg),
    effective_yield_per_rai: Number(effectivePerRai.toFixed(2)),
    yearly_estimated: Math.round(baseYield),     // ก่อนปรับฤดูกาล
    monthly_percent: monthPercent,
    season_factor: fSeason,
    age_factor: fAge,
    care_factor: fCare,
    note: null
  };
}

// ===== PREVIEW: คำนวณอย่างเดียว ไม่บันทึก =====
const previewCalculation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      farm_id, crop_type_id, location, area_rai,
      tree_age_avg, quality, harvest_month,
      calc_date, estimated_yield
    } = req.body || {};

    if (!farm_id || !crop_type_id || !location) {
      return res.status(400).json({ error: 'farm_id, crop_type_id และ location (จังหวัด) จำเป็น' });
    }

    // ฟาร์มต้องเป็นของ user
    const f = await pool.query(
      'SELECT 1 FROM farms WHERE id=$1 AND user_id=$2',
      [farm_id, userId]
    );
    if (!f.rows.length) return res.status(404).json({ error: 'Farm not found' });

    let est = estimated_yield;
    let baseline = null;
    let yearly_estimated = null;
    let monthly_percent = null;
    let season_factor = null;
    let age_factor = null;
    let care_factor = null;
    let effective_yield_per_rai = null;
    let note = null;

    if (est == null) {
      const r = await computeFromProvince({
        crop_type_id,
        province: location,
        area_rai,
        harvest_month,
        tree_age_avg,
        quality
      });
      if (!r) return res.status(404).json({ error: `No average yield for province "${location}"` });

      est                     = r.estimated;
      baseline                = r.baseline_avg_per_rai;
      yearly_estimated        = r.yearly_estimated;
      monthly_percent         = r.monthly_percent;
      season_factor           = r.season_factor;
      age_factor              = r.age_factor;
      care_factor             = r.care_factor;
      effective_yield_per_rai = r.effective_yield_per_rai;
      note                    = r.note;
    }

    return res.json({
      preview: true,
      input: {
        farm_id,
        crop_type_id,
        calc_date,
        location,
        area_rai,
        tree_age_avg,
        quality,
        harvest_month
      },
      result: {
        estimated_yield: est,               // ตัวเลขหลักที่เอาไปโชว์ให้ชาวสวน
        baseline_avg_per_rai: baseline,     // avg จังหวัดเดิม
        effective_yield_per_rai,            // หลังปรับ อายุ + การดูแล
        yearly_estimated,                   // baseYield ก่อนปรับฤดูกาล
        monthly_percent,
        season_factor,
        age_factor,
        care_factor,
        note
      }
    });
  } catch (e) {
    console.error('previewCalculation error:', e);
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

    const f = await pool.query(
      'SELECT 1 FROM farms WHERE id=$1 AND user_id=$2',
      [farm_id, userId]
    );
    if (!f.rows.length) return res.status(404).json({ error: 'Farm not found' });

    let est = estimated_yield;

    if (est == null) {
      const r = await computeFromProvince({
        crop_type_id,
        province: location,
        area_rai,
        harvest_month,
        tree_age_avg,
        quality
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
    console.error('createCalculation error:', e);
    res.status(500).json({ error: e.message });
  }
};

const listCalculations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { farm_id, limit = 20, offset = 0 } = req.query;

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const params = [userId];
    let where = 'WHERE f.user_id = $1';

    if (farm_id) {
      params.push(farm_id);
      where += ` AND c.farm_id = $${params.length}`;
    }

    params.push(safeLimit, safeOffset);

    const { rows } = await pool.query(
      `
      SELECT
        c.id,
        c.farm_id,
        f.name AS farm_name,
        c.crop_type_id,
        ct.name AS crop_type_name,
        c.calc_date,
        c.location,
        c.area_rai,
        c.estimated_yield,
        c.actual_yield,
        c.condition,
        c.created_at
      FROM calculations c
      JOIN farms f ON c.farm_id = f.id
      LEFT JOIN crop_types ct ON c.crop_type_id = ct.id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
      `,
      params
    );

    return res.json({
      items: rows,
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        count: rows.length
      }
    });
  } catch (e) {
    console.error('listCalculations error:', e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = { previewCalculation, createCalculation, listCalculations };
