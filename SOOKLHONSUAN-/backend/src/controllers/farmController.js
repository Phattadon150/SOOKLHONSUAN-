const pool = require('../db');

const createFarm = async (req, res) => {
  const userId = req.user.userId;
  const { name, crop_type_id } = req.body;
  console.log(`[API] POST /api/farms - User ID: ${userId} creating farm with name: ${name}`); // 👈 เพิ่ม

  if (!name || !crop_type_id) {
    console.warn(`[API] POST /api/farms - Validation Failed: Missing fields`); // 👈 เพิ่ม
    return res.status(400).json({ error: 'name and crop_type_id are required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO farms (user_id, name, crop_type_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, crop_type_id, created_at`,
      [userId, name, crop_type_id]
    );
    console.log(`✅ [API] POST /api/farms - Success: Farm created, ID: ${rows[0].id}`); // 👈 เพิ่ม
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(`❌ [API] POST /api/farms - Server Error: ${err.message}`); // 👈 เพิ่ม
    res.status(500).json({ error: err.message });
  }
};

const getFarms = async (req, res) => {
  const userId = req.user.userId;
  console.log(`[API] GET /api/farms - User ID: ${userId} fetching all farms`); // 👈 เพิ่ม
  try {
    const { rows } = await pool.query(
      `SELECT f.id, f.name, f.crop_type_id, c.name AS crop_name, f.created_at
       FROM farms f
       LEFT JOIN crop_types c ON f.crop_type_id = c.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    console.log(`✅ [API] GET /api/farms - Success: Sent ${rows.length} farms for user ID: ${userId}`); // 👈 เพิ่ม
    res.json(rows);
  } catch (err) {
    console.error(`❌ [API] GET /api/farms - Server Error: ${err.message}`); // 👈 เพิ่ม
    res.status(500).json({ error: err.message });
  }
};

const getFarmById = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  console.log(`[API] GET /api/farms/:id - User ID: ${userId} fetching farm ID: ${id}`); // 👈 เพิ่ม
  try {
    const { rows } = await pool.query(
      `SELECT f.id, f.name, f.crop_type_id, c.name AS crop_name, f.created_at
       FROM farms f
       LEFT JOIN crop_types c ON f.crop_type_id = c.id
       WHERE f.id = $1 AND f.user_id = $2`,
      [id, userId]
    );
    if (!rows.length) {
      console.warn(`[API] GET /api/farms/:id - Failed: Farm not found or not owned by user (Farm ID: ${id}, User ID: ${userId})`); // 👈 เพิ่ม
      return res.status(404).json({ error: 'Farm not found' });
    }
    console.log(`✅ [API] GET /api/farms/:id - Success: Sent farm ID: ${id}`); // 👈 เพิ่ม
    res.json(rows[0]);
  } catch (err) {
    console.error(`❌ [API] GET /api/farms/:id - Server Error: ${err.message}`); // 👈 เพิ่ม
    res.status(500).json({ error: err.message });
  }
};

const updateFarm = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { name, crop_type_id } = req.body;
  console.log(`[API] PUT /api/farms/:id - User ID: ${userId} updating farm ID: ${id}`); // 👈 เพิ่ม

  try {
    const { rows } = await pool.query(
      `UPDATE farms
       SET name = COALESCE($1, name),
           crop_type_id = COALESCE($2, crop_type_id)
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, crop_type_id, created_at`,
      [name, crop_type_id, id, userId]
    );
    if (!rows.length) {
      console.warn(`[API] PUT /api/farms/:id - Failed: Farm not found or not owned (Farm ID: ${id}, User ID: ${userId})`); // 👈 เพิ่ม
      return res.status(404).json({ error: 'Farm not found or not yours' });
    }
    console.log(`✅ [API] PUT /api/farms/:id - Success: Updated farm ID: ${id}`); // 👈 เพิ่ม
    res.json(rows[0]);
  } catch (err) {
    console.error(`❌ [API] PUT /api/farms/:id - Server Error: ${err.message}`); // 👈 เพิ่ม
    res.status(500).json({ error: err.message });
  }
};

const deleteFarm = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  console.log(`[API] DELETE /api/farms/:id - User ID: ${userId} deleting farm ID: ${id}`); // 👈 เพิ่ม
  try {
    const result = await pool.query(
      'DELETE FROM farms WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rowCount === 0) {
      console.warn(`[API] DELETE /api/farms/:id - Failed: Farm not found or not owned (Farm ID: ${id}, User ID: ${userId})`); // 👈 เพิ่ม
      return res.status(404).json({ error: 'Farm not found or not yours' });
    }
    console.log(`✅ [API] DELETE /api/farms/:id - Success: Deleted farm ID: ${id}`); // 👈 เพิ่ม
    res.json({ message: 'Farm deleted successfully' });
  } catch (err) {
    console.error(`❌ [API] DELETE /api/farms/:id - Server Error: ${err.message}`); // 👈 เพิ่ม
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createFarm,
  getFarms,
  getFarmById,
  updateFarm,
  deleteFarm
};