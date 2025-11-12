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
const farmRoutes = require('./src/routes/farm');
const cropTypeRoutes = require('./src/routes/cropTypes');
const userRoutes = require('./src/routes/user');
const calculationRoutes = require('./src/routes/calculations');

app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/crop-types', cropTypeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/calculations', calculationRoutes);

module.exports = app;
