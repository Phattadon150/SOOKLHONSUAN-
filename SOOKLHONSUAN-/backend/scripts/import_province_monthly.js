require('dotenv').config();
const xlsx = require('xlsx');
const path = require('path');
const pool = require('../src/db');

const FILE_PATH = path.resolve(__dirname, '../data/สัดส่วนรายเดือน.xlsx');
const CROP_TYPE_ID = 1;

const CANONICAL_PROVINCES = [
  'กรุงเทพมหานคร','กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น','จันทบุรี',
  'ฉะเชิงเทรา','ชัยนาท','ชัยภูมิ','ชุมพร','เชียงราย','เชียงใหม่','ตรัง','ตราด','ตาก',
  'นครนายก','นครปฐม','นครพนม','นครราชสีมา','นครศรีธรรมราช','นครสวรรค์','นนทบุรี',
  'นราธิวาส','น่าน','บึงกาฬ','บุรีรัมย์','ปทุมธานี','ประจวบคีรีขันธ์','ปราจีนบุรี',
  'ปัตตานี','พระนครศรีอยุธยา','พะเยา','พังงา','พัทลุง','พิจิตร','พิษณุโลก','เพชรบุรี',
  'เพชรบูรณ์','แพร่','ภูเก็ต','มหาสารคาม','มุกดาหาร','แม่ฮ่องสอน','ยโสธร','ยะลา',
  'ร้อยเอ็ด','ระนอง','ระยอง','ราชบุรี','ลพบุรี','ลำปาง','ลำพูน','ศรีสะเกษ','สกลนคร',
  'สงขลา','สตูล','สมุทรปราการ','สมุทรสงคราม','สมุทรสาคร','สระแก้ว','สระบุรี',
  'สิงห์บุรี','สุโขทัย','สุพรรณบุรี','สุราษฎร์ธานี','สุรินทร์','หนองคาย','หนองบัวลำภู',
  'อ่างทอง','อำนาจเจริญ','อุดรธานี','อุตรดิตถ์','อุทัยธานี','อุบลราชธานี'
];

const ALIASES = new Map([
  ['ลําปาง','ลำปาง'], ['ลําพูน','ลำพูน'],
  ['หนองบัวลําภู','หนองบัวลำภู'], ['อํานาจเจริญ','อำนาจเจริญ']
]);

function normalizeProvince(name) {
  if (!name) return '';
  let t = String(name).trim().replace(/^จังหวัด\s*/, '');
  t = t.replace(/\u0E4D\u0E32/g, '\u0E33'); 
  t = t.replace(/ล\u0E4D/g, 'ลำ');
  if (ALIASES.has(t)) t = ALIASES.get(t);
  return CANONICAL_PROVINCES.includes(t) ? t : '';
}

const MONTH_MAP = {
  'ม.ค.':1,'ก.พ.':2,'มี.ค.':3,'เม.ย.':4,'พ.ค.':5,'มิ.ย.':6,
  'ก.ค.':7,'ส.ค.':8,'ก.ย.':9,'ต.ค.':10,'พ.ย.':11,'ธ.ค.':12
};

const num = v => Number(String(v).replace(/,/g,'')) || 0;

(async () => {
  const wb = xlsx.readFile(FILE_PATH);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

  let ok = 0, skip = 0;

  for (const r of rows) {
    const province = normalizeProvince(r['จังหวัด']);
    if (!province) { skip++; continue; }

    for (const [label, month] of Object.entries(MONTH_MAP)) {
      const percent = num(r[label]);
      await pool.query(
        `INSERT INTO province_monthly (crop_type_id, province, month, percent, year, source)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (crop_type_id, province, month)
         DO UPDATE SET percent = EXCLUDED.percent, source = EXCLUDED.source`,
        [CROP_TYPE_ID, province, month, percent, 2563, `excel:${path.basename(FILE_PATH)}`]
      );
      ok++;
    }
  }

  console.log(`IMPORT DONE → OK=${ok}, SKIPPED=${skip}`);
  process.exit(0);
})();
