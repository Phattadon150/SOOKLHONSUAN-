const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const normalizeEmail = (e) => (e || '').trim().toLowerCase();
const isValidPlan = (p) => ['free', 'premium'].includes((p || '').toLowerCase());
const normalizeUsername = (u) => (u || '').trim().toLowerCase();

const register = async (req, res) => {
  let { firstname, lastname, email,username, password, plan_type } = req.body || {};
  firstname = (firstname || '').trim();
  lastname  = (lastname  || '').trim();
  email     = normalizeEmail(email);
  username  = normalizeUsername(username);
  plan_type = isValidPlan(plan_type) ? plan_type.toLowerCase() : 'free';

  if (!firstname || !lastname || !email ||!username || !password) {
    return res.status(400).json({ error: 'firstname, lastname, email, username, password are required' });
  }
   if (!/^[a-z0-9_\.]{3,20}$/.test(username)) {
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
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (firstname, lastname, email, username, password, plan_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, firstname, lastname, email, username, plan_type`,
      [firstname, lastname, email, username, hashed, plan_type]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    //เช็คข้อผิดพลาด unique constraint
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    return res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  let { username, password } = req.body || {};
  username = normalizeUsername(username);

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (!result.rows.length) return res.status(400).json({ error: 'Invalid email or password' });

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid email or password' });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT secret not configured' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login };
