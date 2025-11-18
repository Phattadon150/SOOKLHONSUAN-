const pool = require('../db');

const createFarm = async (req, res) => {
  const userId = req.user.userId;
  const { name, crop_type_id } = req.body;

  if (!name || !crop_type_id) {
    return res.status(400).json({ error: 'name and crop_type_id are required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO farms (user_id, name, crop_type_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, crop_type_id, created_at`,
      [userId, name, crop_type_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFarms = async (req, res) => {
  const userId = req.user.userId;
  try {
    const { rows } = await pool.query(
      `SELECT f.id, f.name, f.crop_type_id, c.name AS crop_name, f.created_at
       FROM farms f
       LEFT JOIN crop_types c ON f.crop_type_id = c.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFarmById = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT f.id, f.name, f.crop_type_id, c.name AS crop_name, f.created_at
       FROM farms f
       LEFT JOIN crop_types c ON f.crop_type_id = c.id
       WHERE f.id = $1 AND f.user_id = $2`,
      [id, userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Farm not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateFarm = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { name, crop_type_id } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE farms
       SET name = COALESCE($1, name),
           crop_type_id = COALESCE($2, crop_type_id)
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, crop_type_id, created_at`,
      [name, crop_type_id, id, userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Farm not found or not yours' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteFarm = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM farms WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Farm not found or not yours' });
    }
    res.json({ message: 'Farm deleted successfully' });
  } catch (err) {
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
