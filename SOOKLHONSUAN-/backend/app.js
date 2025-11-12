require('dotenv').config();
const express = require('express');
const pool = require('../backend/src/db');

const app = express();
app.use(express.json());

app.get('/testdb', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ db_time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const authRoutes = require('./src/routes/auth');
app.use('/api/auth', authRoutes);

module.exports = app;
