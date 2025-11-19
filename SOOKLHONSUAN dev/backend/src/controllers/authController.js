// controllers/authController.js

const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const normalizeEmail = (e) => (e || '').trim().toLowerCase();
const isValidPlan = (p) => ['free', 'premium'].includes((p || '').toLowerCase());
const normalizeUsername = (u) => (u || '').trim().toLowerCase();
const isValidUsername = (u) => /^[a-z0-9_\.]{3,20}$/.test(u || '');

// --- Register ---
const register = async (req, res) => {
  let { firstname, lastname, email, username, password, plan_type } = req.body || {};
  firstname = (firstname || '').trim();
  lastname  = (lastname  || '').trim();
  email     = normalizeEmail(email);
  username  = normalizeUsername(username);
  plan_type = isValidPlan(plan_type) ? plan_type.toLowerCase() : 'free';

  if (!firstname || !lastname || !email || !username || !password) {
    return res.status(400).json({ error: 'firstname, lastname, email, username, password are required' });
  }
  if (!/^[a-z0-9_\.]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'username must be 3-20 chars, a-z0-9._ only' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const exist = await pool.query('SELECT 1 FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (exist.rows.length) {
      return res.status(400).json({ error: 'Email or username already exists' });
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
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    return res.status(500).json({ error: err.message });
  }
};

// --- Login ---
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

    // สร้าง Token โดยใช้ key 'id'
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
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

// --- Get Me (แก้ไขแล้ว) ---
const getMe = async (req, res) => {
  try {
    // ⭐️ แก้ไข: รองรับทั้ง .id (จากการ sign ปกติ) และ .userId (เผื่อกรณีอื่น)
    // หาก req.user ไม่มีค่าเลย ให้ถือว่าเป็น undefined
    const userPayload = req.user || {};
    const userId = userPayload.id || userPayload.userId;

    if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
    }

    const { rows } = await pool.query(
      'SELECT id, firstname, lastname, email, username, plan_type, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    
    res.json(rows[0]);
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: err.message });
  }
};

// --- Check Username ---
const checkUsername = async (req, res) => {
  try {
    let { username } = req.query || {};
    username = normalizeUsername(username);

    if (!username) return res.status(400).json({ error: 'username is required' });
    if (!isValidUsername(username)) return res.status(400).json({ error: 'username must be 3-20 chars, a-z0-9._ only' });

    const exist = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
    return res.json({ available: exist.rows.length === 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// --- Google Login ---
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = normalizeEmail(payload.email);
    const firstname = (payload.given_name || '').trim();
    const lastname = (payload.family_name || '').trim();
    const picture = payload.picture || null;
    const googleId = payload.sub;
    const emailVerified = !!payload.email_verified;

    if (!email) return res.status(400).json({ error: 'Google account has no email' });

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length) {
      let user = result.rows[0];
      try {
        await pool.query(
          `UPDATE users SET google_id = COALESCE(google_id, $1), provider = CASE WHEN provider IS NULL OR provider = 'local' THEN 'local_google' ELSE provider END, picture = COALESCE(picture, $2), email_verified = COALESCE(email_verified, $3) WHERE id = $4`,
          [googleId, picture, emailVerified, user.id]
        );
        const updated = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
        user = updated.rows[0];
      } catch (_) {} 

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        token,
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          username: user.username,
          plan_type: user.plan_type,
          picture: user.picture || picture || null
        }
      });
    }

    const baseUsername = (email.split('@')[0] || '').toLowerCase();
    const suggestedUsername = (baseUsername.replace(/[^a-z0-9_\.]/gi, '') || '').slice(0, 20);
    const tempToken = jwt.sign(
      { googleId, email, firstname, lastname, picture, emailVerified },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({
      status: 'NEED_USERNAME',
      suggested_username: suggestedUsername,
      google_profile: { firstname, lastname, email, picture },
      temp_token: tempToken
    });
  } catch (err) {
    console.error('googleLogin error:', err);
    return res.status(500).json({ error: 'Google login failed' });
  }
};

// --- Google Complete Signup ---
const googleCompleteSignup = async (req, res) => {
  try {
    let { tempToken, username, plan_type } = req.body || {};
    username = normalizeUsername(username);
    plan_type = isValidPlan(plan_type) ? plan_type.toLowerCase() : 'free';

    if (!tempToken || !username) return res.status(400).json({ error: 'tempToken and username are required' });
    if (!isValidUsername(username)) return res.status(400).json({ error: 'username must be 3-20 chars, a-z0-9._ only' });

    let payload;
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid or expired temp token' });
    }

    const { googleId, email, firstname, lastname, picture, emailVerified } = payload;
    const conflict = await pool.query('SELECT 1 FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (conflict.rows.length) return res.status(409).json({ error: 'Email or username already exists' });

    const dummyPassword = await bcrypt.hash('google-' + googleId, 10);
    const insert = await pool.query(
      `INSERT INTO users (firstname, lastname, email, username, password, google_id, provider, picture, email_verified, plan_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, firstname, lastname, email, username, plan_type, picture`,
      [(firstname || '').trim(), (lastname  || '').trim(), email, username, dummyPassword, googleId, 'google', picture, emailVerified, plan_type]
    );

    const user = insert.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error('googleCompleteSignup error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// --- Forgot Password ---
const forgotPassword = async (req, res) => {
  try {
    let { email } = req.body || {};
    email = (email || '').trim().toLowerCase();

    if (!email) return res.status(400).json({ error: 'email is required' });

    const result = await pool.query('SELECT id, email FROM users WHERE email = $1 LIMIT 1', [email]);

    if (!result.rows.length) {
      return res.json({ message: 'If this email exists, a reset link has been sent.' });
    }

    const user = result.rows[0];

    // สร้าง Token สุ่ม
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 นาที

    // อัปเดตลง DB
    await pool.query(
      `UPDATE users
       SET reset_token = $1,
           reset_token_expires = $2
       WHERE id = $3`,
      [token, expires, user.id]
    );

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    console.log('============================================');
    console.log('🔑 RESET PASSWORD LINK:', resetLink);
    console.log('============================================');

    return res.json({
      message: 'If this email exists, a reset link has been sent.'
    });

  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// --- Reset Password ---
const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body || {};

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ error: 'token, password, confirmPassword are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 chars' });
    }

    // หา User จาก Token
    const find = await pool.query(
      'SELECT id, reset_token_expires FROM users WHERE reset_token = $1 LIMIT 1',
      [token]
    );

    if (!find.rows.length) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = find.rows[0];

    // เช็คเวลาหมดอายุ
    if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'Token expired' });
    }

    // Hash รหัสผ่านใหม่
    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE users
       SET password = $1,
           reset_token = NULL,
           reset_token_expires = NULL
       WHERE id = $2`,
      [hashed, user.id]
    );

    return res.json({ message: 'Password reset successful' });

  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { 
  register, 
  login, 
  getMe, 
  checkUsername, 
  googleLogin, 
  googleCompleteSignup,
  forgotPassword,
  resetPassword
};