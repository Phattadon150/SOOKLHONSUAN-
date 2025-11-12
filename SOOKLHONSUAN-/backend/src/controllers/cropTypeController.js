const pool = require('../db');

const getCropTypes = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, description FROM crop_types ORDER BY id ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getCropTypes };
