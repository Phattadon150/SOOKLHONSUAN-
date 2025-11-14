const pool = require('../db');
const { getProvinceAvgYield } = require('../utils/provinceAvg');
const { getProvinceMonthlyPattern } = require('../utils/monthlyPattern');

// ================== HELPERS ==================
// (...ฟังก์ชัน ageFactor, careFactor, seasonFactorFromPattern ...โค้ดเดิม...)
function ageFactor(ageYears) {
  const a = Number(ageYears);
  let factor = 0.6; // default
  if (!Number.isFinite(a) || a <= 0)  factor = 0.6;
  else if (a < 3)   factor = 0.8;
  else if (a <= 8)  factor = 1.0;
  else if (a <= 15) factor = 0.95;
  else              factor = 0.85;
  return factor;
}
function careFactor(quality) {
  let factor = 1.0; // default
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
// ( ...ฟังก์ชัน computeFromProvince ...โค้ดเดิม...)
async function computeFromProvince({
  crop_type_id, province, area_rai, harvest_month, tree_age_avg, quality
}) {
  console.log('[Helper: compute] เริ่มคำนวณจากจังหวัด:', { crop_type_id, province, area_rai, harvest_month, tree_age_avg, quality });
  const avg = await getProvinceAvgYield({ crop_type_id, province });
  console.log(`[Helper: compute] ค่าเฉลี่ยจังหวัด (${province}): ${avg} กก./ไร่`);
  if (avg == null) return null;
  const area = Number(area_rai);
  const safeArea = Number.isFinite(area) && area > 0 ? area : 0;
  console.log(`[Helper: compute] พื้นที่ (ไร่): ${safeArea}`);
  const fAge = ageFactor(tree_age_avg);
  const fCare = careFactor(quality);
  console.log(`[Helper: compute] Factors -> Age: ${fAge}, Care: ${fCare}`);
  const effectivePerRai = Number(avg) * fAge * fCare;
  const baseYield = safeArea * effectivePerRai;
  console.log(`[Helper: compute] ผลผลิตพื้นฐาน (ต่อไร่): ${effectivePerRai.toFixed(2)}, ผลผลิตพื้นฐาน (รวม): ${baseYield.toFixed(2)}`);
  if (!harvest_month) {
    console.log('[Helper: compute] ไม่ระบุเดือน, ใช้ผลผลิตพื้นฐาน');
    const result = {
      estimated: Math.round(baseYield),
      baseline_avg_per_rai: Number(avg),
      effective_yield_per_rai: Number(effectivePerRai.toFixed(2)),
      yearly_estimated: Math.round(baseYield),
      monthly_percent: null,
      season_factor: 1.0, age_factor: fAge, care_factor: fCare, note: null
    };
    console.log('[Helper: compute] ผลลัพธ์:', result);
    return result;
  }
  console.log('[Helper: compute] ระบุเดือน, กำลังดึง Pattern รายเดือน...');
  const pattern = await getProvinceMonthlyPattern({ crop_type_id, province });
  const { factor: fSeason, monthPercent } = seasonFactorFromPattern(pattern, harvest_month);
  console.log(`[Helper: compute] Factor ฤดูกาล: ${fSeason} (Percent: ${monthPercent})`);
  if (fSeason === 0) {
    console.log('[Helper: compute] นอกฤดูกาล, ผลผลิต = 0');
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
  console.log(`[Helper: compute] ผลผลิตตามฤดูกาล: ${estSeasonal.toFixed(2)}`);
  const finalResult = {
    estimated: Math.round(estSeasonal),
    baseline_avg_per_rai: Number(avg),
    effective_yield_per_rai: Number(effectivePerRai.toFixed(2)),
    yearly_estimated: Math.round(baseYield),
    monthly_percent: monthPercent,
    season_factor: fSeason, age_factor: fAge, care_factor: fCare, note: null
  };
  console.log('[Helper: compute] ผลลัพธ์สุดท้าย:', finalResult);
  return finalResult;
}

// ===== PREVIEW: คำนวณอย่างเดียว ไม่บันทึก =====
const previewCalculation = async (req, res) => {
  // ( ... โค้ดเดิม ... )
  console.log('--- [CalcController: previewCalculation] เริ่มต้น ---');
  try {
    const userId = req.user.userId;
    const body = req.body || {};
    console.log(`[Calc: preview] UserID: ${userId}, Body:`, body);
    const { farm_id, crop_type_id, location } = body;
    if (!farm_id || !crop_type_id || !location) {
      console.warn('[Calc: preview] Validation Failed: ข้อมูลไม่ครบ');
      return res.status(400).json({ error: 'farm_id, crop_type_id และ location (จังหวัด) จำเป็น' });
    }
    console.log(`[Calc: preview] ตรวจสอบ Farm ID: ${farm_id} ของ User: ${userId}`);
    const f = await pool.query('SELECT 1 FROM farms WHERE id=$1 AND user_id=$2', [farm_id, userId]);
    if (!f.rows.length) {
      console.warn('[Calc: preview] Error: ไม่พบ Farm');
      return res.status(404).json({ error: 'Farm not found' });
    }
    let est = body.estimated_yield;
    let resultPayload = {};
    if (est == null) {
      console.log('[Calc: preview] estimated_yield = null, เริ่มคำนวณ...');
      const r = await computeFromProvince({ ...body, province: location }); // ⭐️ แก้ไข: ส่ง province
      if (!r) {
        console.warn(`[Calc: preview] Error: ไม่มีข้อมูลผลผลิตเฉลี่ยของจังหวัด "${location}"`);
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
      console.log('[Calc: preview] คำนวณสำเร็จ, estimated_yield =', est);
    } else {
      console.log(`[Calc: preview] ใช้ estimated_yield ที่ส่งมา: ${est}`);
    }
    const response = {
      preview: true,
      input: body,
      result: {
        estimated_yield: est,
        ...resultPayload
      }
    };
    console.log('[Calc: preview] ส่งผลลัพธ์ Preview สำเร็จ');
    return res.json(response);
  } catch (e) {
    console.error('--- [CalcController: previewCalculation] เกิดข้อผิดพลาด ---');
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

// ===== CREATE: บันทึกจริง =====
const createCalculation = async (req, res) => {
  // ( ... โค้ดเดิม ... )
  console.log('--- [CalcController: createCalculation] เริ่มต้น ---');
  try {
    const userId = req.user.userId;
    const {
      farm_id, crop_type_id, location, area_rai,
      tree_age_avg, quality, harvest_month,
      calc_date, estimated_yield, actual_yield
    } = req.body || {};
    console.log(`[Calc: create] UserID: ${userId}, Body:`, req.body);
    if (!farm_id || !crop_type_id || !location) {
      console.warn('[Calc: create] Validation Failed: ข้อมูลไม่ครบ');
      return res.status(400).json({ error: 'farm_id, crop_type_id และ location (จังหวัด) จำเป็น' });
    }
    console.log(`[Calc: create] ตรวจสอบ Farm ID: ${farm_id} ของ User: ${userId}`);
    const f = await pool.query('SELECT 1 FROM farms WHERE id=$1 AND user_id=$2', [farm_id, userId]);
    if (!f.rows.length) {
      console.warn('[Calc: create] Error: ไม่พบ Farm');
      return res.status(404).json({ error: 'Farm not found' });
    }
    let est = estimated_yield;
    if (est == null) {
      console.log('[Calc: create] estimated_yield = null, เริ่มคำนวณ...');
      const r = await computeFromProvince({
        crop_type_id, province: location, area_rai, harvest_month, tree_age_avg, quality
      });
      if (!r) {
        console.warn(`[Calc: create] Error: ไม่มีข้อมูลผลผลิตเฉลี่ยของจังหวัด "${location}"`);
        return res.status(404).json({ error: `No average yield for province "${location}"` });
      }
      est = r.estimated;
      console.log('[Calc: create] คำนวณสำเร็จ, estimated_yield =', est);
    } else {
      console.log(`[Calc: create] ใช้ estimated_yield ที่ส่งมา: ${est}`);
    }
    const safeActualYield = (typeof actual_yield === 'number') ? actual_yield : null;
    console.log(`[Calc: create] กำลังบันทึก Calculation (Actual: ${safeActualYield})...`);
    const { rows } = await pool.query(
      `INSERT INTO calculations
        (farm_id, crop_id, crop_type_id, calc_date, location, area_rai,
         estimated_yield, actual_yield, condition, harvest_month, tree_age_avg, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, $10, $11, NOW())
       RETURNING id, farm_id, crop_type_id, calc_date, location, area_rai,
                 estimated_yield, actual_yield, condition, harvest_month, tree_age_avg, created_at`,
      [
        farm_id, null, crop_type_id, calc_date || null, location, area_rai || null,
        est, safeActualYield, quality || null, harvest_month || null, tree_age_avg || null
      ]
    );
    console.log('[Calc: create] บันทึก Calculation สำเร็จ:', rows[0]);
    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error('--- [CalcController: createCalculation] เกิดข้อผิดพลาด ---');
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

// ⭐️ ===== GET ALL: ดึงผลการคำนวณทั้งหมดของ User (เพิ่มใหม่) =====
const getCalculationsByUser = async (req, res) => {
  console.log('--- [CalcController: getCalculationsByUser] เริ่มต้น ---');
  try {
    const userId = req.user.userId;
    console.log(`[Calc: getAll] กำลังดึง Calculations ทั้งหมดของ User ID: ${userId}`);

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

    console.log(`[Calc: getAll] พบ ${rows.length} รายการ`);
    res.json(rows);

  } catch (e) {
    console.error('--- [CalcController: getCalculationsByUser] เกิดข้อผิดพลาด ---');
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};


// ⭐️ ===== อัปเดต module.exports =====
module.exports = { 
  previewCalculation, 
  createCalculation,
  getCalculationsByUser // 👈 เพิ่มฟังก์ชันใหม่
};