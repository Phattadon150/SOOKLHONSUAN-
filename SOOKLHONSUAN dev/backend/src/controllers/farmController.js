const pool = require('../db');

// 1. สร้างฟาร์ม
const createFarm = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, crop_type_id } = req.body;
    if (!name || !crop_type_id) return res.status(400).json({ error: 'Missing fields' });

    const { rows } = await pool.query(
      `INSERT INTO farms (user_id, name, crop_type_id) VALUES ($1, $2, $3) RETURNING *`,
      [userId, name, crop_type_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// 2. ดึงฟาร์มทั้งหมด (⭐️ แก้ไข: เพิ่ม custom_price)
const getFarms = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      `SELECT f.id, f.name, f.crop_type_id, f.custom_price, c.name AS crop_name, f.created_at
       FROM farms f
       LEFT JOIN crop_types c ON f.crop_type_id = c.id
       WHERE f.user_id = $1 ORDER BY f.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// 3. ดึงฟาร์มทีละตัว (⭐️ แก้ไข: เพิ่ม custom_price)
const getFarmById = async (req, res) => {
  try {
    const userId = req.user.id;
    const farmId = parseInt(req.params.id);
    const { rows } = await pool.query(
      `SELECT f.id, f.name, f.crop_type_id, f.custom_price, c.name AS crop_name
       FROM farms f
       LEFT JOIN crop_types c ON f.crop_type_id = c.id
       WHERE f.id = $1 AND f.user_id = $2`,
      [farmId, userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// 4. อัปเดตฟาร์ม (⭐️ แก้ไข: รองรับการแก้ custom_price)
const updateFarm = async (req, res) => {
  try {
    const userId = req.user.id;
    const farmId = parseInt(req.params.id);
    const { name, crop_type_id, custom_price } = req.body; // รับค่า custom_price มาด้วย

    const { rows } = await pool.query(
      `UPDATE farms
       SET name = COALESCE($1, name),
           crop_type_id = COALESCE($2, crop_type_id),
           custom_price = COALESCE($3, custom_price) 
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, crop_type_id, custom_price, farmId, userId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// 5. ลบฟาร์ม (เหมือนเดิม)
const deleteFarm = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const farmId = parseInt(req.params.id);
    await client.query('BEGIN');
    await client.query('DELETE FROM calculations WHERE farm_id = $1', [farmId]);
    const result = await client.query('DELETE FROM farms WHERE id = $1 AND user_id = $2', [farmId, userId]);
    if (result.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    await client.query('COMMIT');
    res.json({ message: 'Deleted' });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }); } finally { client.release(); }
};

module.exports = { createFarm, getFarms, getFarmById, updateFarm, deleteFarm };