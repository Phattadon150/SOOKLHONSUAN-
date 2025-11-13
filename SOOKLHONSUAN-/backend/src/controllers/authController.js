const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const normalizeEmail = (e) => (e || '').trim().toLowerCase();
const isValidPlan = (p) => ['free', 'premium'].includes((p || '').toLowerCase());
const normalizeUsername = (u) => (u || '').trim().toLowerCase();

const register = async (req, res) => {
  console.log('[API] POST /api/auth/register - Received request'); // 👈 เพิ่ม
  let { firstname, lastname, email,username, password, plan_type } = req.body || {};
  firstname = (firstname || '').trim();
  lastname  = (lastname  || '').trim();
  email     = normalizeEmail(email);
  username  = normalizeUsername(username);
  plan_type = isValidPlan(plan_type) ? plan_type.toLowerCase() : 'free';

  if (!firstname || !lastname || !email ||!username || !password) {
    console.warn('[API] POST /api/auth/register - Validation Failed: Missing required fields'); // 👈 เพิ่ม
    return res.status(400).json({ error: 'firstname, lastname, email, username, password are required' });
  }
   if (!/^[a-z0-9_\.]{3,20}$/.test(username)) {
    console.warn(`[API] POST /api/auth/register - Validation Failed: Invalid username format (${username})`); // 👈 เพิ่ม
    return res.status(400).json({ error: 'username must be 3-20 chars, a-z0-9._ only' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // เช็คซ้ำ
    const exist = await pool.query('SELECT 1 FROM users WHERE email = $1 OR username = $2' , 
    [email, username]
  );
    if (exist.rows.length) {
      console.warn(`[API] POST /api/auth/register - Failed: Email or username already exists (${email} / ${username})`); // 👈 เพิ่ม
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (firstname, lastname, email, username, password, plan_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, firstname, lastname, email, username, plan_type`,
      [firstname, lastname, email, username, hashed, plan_type]
    );

    console.log(`✅ [API] POST /api/auth/register - Success: User created with ID ${result.rows[0].id}`); // 👈 เพิ่ม
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    //เช็คข้อผิดพลาด unique constraint
    if (err.code === '23505') {
      console.warn(`[API] POST /api/auth/register - DB Error: Unique constraint violation (${err.detail})`); // 👈 เพิ่ม
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    console.error(`❌ [API] POST /api/auth/register - Server Error: ${err.message}`); // 👈 เพิ่ม
    return res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  let { username, password } = req.body || {};
  username = normalizeUsername(username);
  console.log(`[API] POST /api/auth/login - Received login attempt for user: ${username}`); // 👈 เพิ่ม

  if (!username || !password) {
    console.warn(`[API] POST /api/auth/login - Validation Failed: Missing fields`); // 👈 เพิ่ม
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (!result.rows.length) {
      console.warn(`[API] POST /api/auth/login - Auth Failed: User not found (${username})`); // 👈 เพิ่ม
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.warn(`[API] POST /api/auth/login - Auth Failed: Invalid password for user (${username})`); // 👈 เพิ่ม
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (!process.env.JWT_SECRET) {
      console.error(`❌ [API] POST /api/auth/login - Server Error: JWT_SECRET not configured!`); // 👈 เพิ่ม
      return res.status(500).json({ error: 'JWT secret not configured' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log(`✅ [API] POST /api/auth/login - Success: User logged in, ID: ${user.id}`); // 👈 เพิ่ม
    res.json({
      token,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        username: user.username,
        plan_type: user.plan_type
      }
    });
  } catch (err) {
    console.error(`❌ [API] POST /api/auth/login - Server Error: ${err.message}`); // 👈 เพิ่ม
    res.status(500).json({ error: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(`[API] GET /api/users/profile - Received request for user ID: ${userId}`); // 👈 เพิ่ม
    const { rows } = await pool.query(
      'SELECT id, firstname, lastname, email, username, plan_type, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (!rows.length) {
      console.warn(`[API] GET /api/users/profile - Failed: User not found in DB, ID: ${userId}`); // 👈 เพิ่ม
      return res.status(404).json({ error: 'User not found' });
    }
    console.log(`✅ [API] GET /api/users/profile - Success: Sent profile data for user ID: ${userId}`); // 👈 เพิ่ม
    res.json(rows[0]);
  } catch (err) {
    console.error(`❌ [API] GET /api/users/profile - Server Error: ${err.message}`); // 👈 เพิ่ม
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, getMe };