require('dotenv').config();
const xlsx = require('xlsx');
const path = require('path');
const pool = require('../src/db');

const FILE_PATH = path.resolve(__dirname, '../data/ผลผลิตรายปี.xlsx');
const CROP_TYPE_ID = 1; // ลำไย

// ===== Provinces & Normalization =====
const CANONICAL_PROVINCES = [
  'กรุงเทพมหานคร','กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น','จันทบุรี','ฉะเชิงเทรา',
  'ชัยนาท','ชัยภูมิ','ชุมพร','เชียงราย','เชียงใหม่','ตรัง','ตราด','ตาก','นครนายก','นครปฐม','นครพนม',
  'นครราชสีมา','นครศรีธรรมราช','นครสวรรค์','นนทบุรี','นราธิวาส','น่าน','บึงกาฬ','บุรีรัมย์','ปทุมธานี',
  'ประจวบคีรีขันธ์','ปราจีนบุรี','ปัตตานี','พระนครศรีอยุธยา','พะเยา','พังงา','พัทลุง','พิจิตร','พิษณุโลก',
  'เพชรบุรี','เพชรบูรณ์','แพร่','ภูเก็ต','มหาสารคาม','มุกดาหาร','แม่ฮ่องสอน','ยโสธร','ยะลา','ร้อยเอ็ด',
  'ระนอง','ระยอง','ราชบุรี','ลพบุรี','ลำปาง','ลำพูน','ศรีสะเกษ','สกลนคร','สงขลา','สตูล','สมุทรปราการ',
  'สมุทรสงคราม','สมุทรสาคร','สระแก้ว','สระบุรี','สิงห์บุรี','สุโขทัย','สุพรรณบุรี','สุราษฎร์ธานี',
  'สุรินทร์','หนองคาย','หนองบัวลำภู','อ่างทอง','อำนาจเจริญ','อุดรธานี','อุตรดิตถ์','อุทัยธานี','อุบลราชธานี'
];
const PROVINCE_ALIASES = new Map([
  ['กรุงเทพฯ','กรุงเทพมหานคร'],
  ['ลําปาง','ลำปาง'],
  ['หนองบัวลําภู','หนองบัวลำภู'],
  ['อํานาจเจริญ','อำนาจเจริญ']
]);
const AGGREGATE_AREAS = new Set(['รวมทั้งประเทศ','เหนือ','ตะวันออกเฉียงเหนือ','กลาง','ใต้']);

function normalizeThai(s) {
  if (!s) return '';
  let t = String(s).trim();
  t = t.replace(/^จังหวัด\s*/,'').replace(/\s+/g,' ');
  if (t === 'กรุงเทพฯ') t = 'กรุงเทพมหานคร';
  t = t.replace(/\u0E4D\u0E32/g, '\u0E33'); // ํ + า -> ำ
  t = t.replace(/ล\u0E4D/g, 'ลำ');
  if (PROVINCE_ALIASES.has(t)) t = PROVINCE_ALIASES.get(t);
  return t;
}
function toCanonicalProvince(name) {
  const norm = normalizeThai(name);
  if (!norm || AGGREGATE_AREAS.has(norm)) return '';
  if (CANONICAL_PROVINCES.includes(norm)) return norm;
  const alias = PROVINCE_ALIASES.get(norm);
  if (alias && CANONICAL_PROVINCES.includes(alias)) return alias;
  return '';
}

// พ.ศ. -> ค.ศ.
const toAD = (y) => (y > 2500 ? y - 543 : y);

const parseNum = (v) => {
  if (v == null) return NaN;
  const s = String(v).toString().replace(/,/g,'').trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

// ถ้าไม่มีคอลัมน์ "ค่าเฉลี่ย" ให้เฉลี่ยจากปี 2563–2567
function computeAvg(row, avgKey, yearKeys) {
  const direct = parseNum(row[avgKey]);
  if (!Number.isNaN(direct) && direct > 0) return +direct.toFixed(2);
  const vals = yearKeys.map(k => parseNum(row[k])).filter(v => !Number.isNaN(v) && v > 0);
  if (!vals.length) return null;
  const sum = vals.reduce((a,b)=>a+b,0);
  return +(sum/vals.length).toFixed(2);
}

(async () => {
  try {
    const wb = xlsx.readFile(FILE_PATH);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

    if (!rows.length) {
      console.error('ไม่พบแถวข้อมูลในไฟล์');
      process.exit(1);
    }

    const keys = Object.keys(rows[0]);
    console.log('Headers:', keys);

    const areaKey = keys.includes('__EMPTY')
      ? '__EMPTY'
      : (keys.find(k => /จังหวัด|พื้นที่|province/i.test(k)) || keys[0]);

    const yearKeys = keys.filter(k => /^25\d{2}$/.test(k));
    const avgKey = keys.find(k => String(k).includes('ค่าเฉลี่ย')) || 'ค่าเฉลี่ย';

    if (!yearKeys.length && !keys.includes(avgKey)) {
      console.error('หา header ปี พ.ศ. (เช่น 2563-2567) หรือคอลัมน์ "ค่าเฉลี่ย" ไม่เจอ');
      process.exit(1);
    }
    console.log('Area column:', areaKey);
    console.log('Year columns detected:', yearKeys);
    console.log('Average column:', avgKey);

    console.log('Sample areas:', rows.slice(0,5).map(r=>r[areaKey]));

    let okPerYear = 0, okAvg = 0, skip = 0;

    for (const r of rows) {
      const rawArea = r[areaKey];
      const area = toCanonicalProvince(rawArea);
      if (!area) { skip++; continue; } // ไม่ใช่จังหวัด / เป็นภาค/รวมประเทศ → ข้าม

      // insert รายปี
      for (const yKey of yearKeys) {
        const v = parseNum(r[yKey]);
        if (Number.isNaN(v) || v <= 0) continue;
        const adYear = toAD(parseNum(yKey));
        await pool.query(
          `INSERT INTO province_yields (crop_type_id, province, year, avg_yield_rai, source)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (crop_type_id, province, year)
           DO UPDATE SET avg_yield_rai = EXCLUDED.avg_yield_rai, source = EXCLUDED.source`,
          [CROP_TYPE_ID, area, adYear, v, `excel:${path.basename(FILE_PATH)}`]
        );
        okPerYear++;
      }

      // ค่าเฉลี่ยรวมเป็น year=0
      const avg = computeAvg(r, avgKey, yearKeys);
      if (avg != null) {
        await pool.query(
          `INSERT INTO province_yields (crop_type_id, province, year, avg_yield_rai, source)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (crop_type_id, province, year)
           DO UPDATE SET avg_yield_rai = EXCLUDED.avg_yield_rai, source = EXCLUDED.source`,
          [CROP_TYPE_ID, area, 0, avg, `excel:avg:${path.basename(FILE_PATH)}`]
        );
        okAvg++;
      }
    }

    console.log(`นำเข้าข้อมูลสำเร็จ: แถวปีจริง OK=${okPerYear}, แถวค่าเฉลี่ย(year=0) OK=${okAvg}, ข้าม=${skip}.`);
    console.log(`TIP: ดึงค่าเฉลี่ยรวมหลายปีได้ด้วย year=0 หรือใช้ year=avg ให้ DB คำนวณสด`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
