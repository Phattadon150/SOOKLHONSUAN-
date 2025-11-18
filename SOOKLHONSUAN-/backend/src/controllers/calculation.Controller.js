const pool = require('../db');
const { getProvinceAvgYield } = require('../utils/provinceAvg');
const { getProvinceMonthlyPattern } = require('../utils/monthlyPattern');

// ================== HELPERS ==================

// ปัจจัยอายุของต้นลำไย (ปี)
function ageFactor(ageYears) {
  const a = Number(ageYears);
  if (!Number.isFinite(a) || a <= 0) return 0.6;   // ยังเล็กมากๆหรือไม่รู้ข้อมูล

  if (a < 3) return 0.8;   // ยังไม่เต็มที่
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

async function computeFromProvince({
  crop_type_id, 
  province, 
  area_rai, 
  harvest_month, 
  tree_age_avg, 
  quality
}) 
{
  console.log('[Helper: compute] เริ่มคำนวณจากจังหวัด:', { 
    crop_type_id, 
    province, 
    area_rai, 
    harvest_month, 
    tree_age_avg, 
    quality 
  });

  const avg = await getProvinceAvgYield({ 
    crop_type_id, 
    province 
  });
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
  console.log('--- [CalcController: previewCalculation] เริ่มต้น ---');
  try {
    const userId = req.user.id;
    const body = req.body || {};

    const { farm_id, crop_type_id, location } = body;
    console.log(`[Calc: preview] UserID: ${userId}, Body:`, body);

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
      const r = await computeFromProvince({ ...body, province: location });
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
  console.log('--- [CalcController: createCalculation] เริ่มต้น ---');
  try {
    const userId = req.user.id;
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

const getCalculationsByUser = async (req, res) => {
  console.log('--- [CalcController: getCalculationsByUser] เริ่มต้น ---');
  try {
    const userId = req.user.id;
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

// ===== DELETE: ลบรายการ =====
const deleteCalculation = async (req, res) => {
  console.log('--- [CalcController: deleteCalculation] เริ่มต้น ---');
  try {
    const userId = req.user.id;
    const { id } = req.params;
    console.log(`[Calc: delete] UserID: ${userId}, CalcID: ${id}`);

    const calcId = parseInt(id, 10);
    if (isNaN(calcId) || calcId <= 0) {
      return res.status(400).json({ error: 'Invalid Calculation ID format' });
    }

    const result = await pool.query(
      `DELETE FROM calculations c
       USING farms f
       WHERE c.farm_id = f.id
         AND c.id = $1
         AND f.user_id = $2`,
      [calcId, userId]
    );

    if (result.rowCount === 0) {
      console.warn(`[Calc: delete] Error: ไม่พบ Calc ID: ${calcId} ของ User: ${userId}`);
      return res.status(404).json({ error: 'Calculation not found or not yours' });
    }

    console.log(`[Calc: delete] ลบ Calculation ID: ${calcId} สำเร็จ`);
    res.json({ message: 'Calculation deleted successfully' });

  } catch (err) {
    console.error('--- [CalcController: deleteCalculation] เกิดข้อผิดพลาด ---');
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ===== UPDATE: อัปเดตรายการ (บันทึกผลจริง) =====
const updateCalculation = async (req, res) => {
  console.log('--- [CalcController: updateCalculation] เริ่มต้น ---');
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { actual_yield, calc_date } = req.body;

    console.log(`[Calc: update] UserID: ${userId}, CalcID: ${id}, Body:`, req.body);

    const calcId = parseInt(id, 10);
    if (isNaN(calcId) || calcId <= 0) {
      return res.status(400).json({ error: 'Invalid Calculation ID format' });
    }

    const safeActualYield = Number(actual_yield);
    if (actual_yield == null || !Number.isFinite(safeActualYield) || safeActualYield < 0) {
      return res.status(400).json({ error: 'actual_yield (ผลผลิตจริง) is required and must be a number' });
    }

    const safeCalcDate = calc_date ? new Date(calc_date) : new Date();
    if (isNaN(safeCalcDate.getTime())) {
      return res.status(400).json({ error: 'Invalid calc_date format' });
    }

    console.log(`[Calc: update] Updating CalcID: ${calcId} with Actual: ${safeActualYield}, Date: ${safeCalcDate.toISOString()}`);

    const { rows } = await pool.query(
      `UPDATE calculations c
       SET 
         actual_yield = $1,
         calc_date = $2 
       FROM farms f
       WHERE c.id = $3
         AND c.farm_id = f.id
         AND f.user_id = $4
       RETURNING c.id, c.farm_id, c.location, c.estimated_yield, c.actual_yield, c.calc_date`,
      [safeActualYield, safeCalcDate, calcId, userId]
    );

    if (rows.length === 0) {
      console.warn(`[Calc: update] Error: ไม่พบ Calc ID: ${calcId} ของ User: ${userId}`);
      return res.status(404).json({ error: 'Calculation not found or not yours' });
    }

    console.log('[Calc: update] อัปเดตสำเร็จ:', rows[0]);
    res.json(rows[0]);

  } catch (err) {
    console.error('--- [CalcController: updateCalculation] เกิดข้อผิดพลาด ---');
    console.error(err);
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
