// authController.js (ฉบับแก้ไข)

const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const normalizeEmail = (e) => (e || '').trim().toLowerCase();
const isValidPlan = (p) => ['free', 'premium'].includes((p || '').toLowerCase());
const normalizeUsername = (u) => (u || '').trim().toLowerCase();

const register = async (req, res) => {
  console.log('--- [AuthController: register] เริ่มต้น ---');
  try {
    let { firstname, lastname, email, username, password, plan_type } = req.body || {};
    firstname = (firstname || '').trim();
    lastname  = (lastname  || '').trim();
    email     = normalizeEmail(email);
    username  = normalizeUsername(username);
    plan_type = isValidPlan(plan_type) ? plan_type.toLowerCase() : 'free';

    console.log('[Auth: register] ข้อมูลที่ได้รับ (ยกเว้นรหัสผ่าน):', { firstname, lastname, email, username, plan_type });

    if (!firstname || !lastname || !email ||!username || !password) {
      console.warn('[Auth: register] Validation Failed: ข้อมูลไม่ครบ');
      return res.status(400).json({ error: 'firstname, lastname, email, username, password are required' });
    }
    if (!/^[a-z0-9_\.]{3,20}$/.test(username)) {
      console.warn('[Auth: register] Validation Failed: Username format ไม่ถูกต้อง');
      return res.status(400).json({ error: 'username must be 3-20 chars, a-z0-9._ only' });
    }
    if (password.length < 8) {
      console.warn('[Auth: register] Validation Failed: รหัสผ่านสั้นไป');
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    console.log('[Auth: register] กำลังตรวจสอบ Email/Username ซ้ำ...');
    const exist = await pool.query('SELECT 1 FROM users WHERE email = $1 OR username = $2', [email, username]);
    
    if (exist.rows.length) {
      console.warn('[Auth: register] Error: Email หรือ Username นี้มีอยู่แล้ว');
      return res.status(400).json({ error: 'Email already exists' });
    }

    console.log('[Auth: register] กำลัง Hashing รหัสผ่าน...');
    const hashed = await bcrypt.hash(password, 10);

    console.log('[Auth: register] กำลังบันทึก User ลงฐานข้อมูล...');
    const result = await pool.query(
      `INSERT INTO users (firstname, lastname, email, username, password, plan_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, firstname, lastname, email, username, plan_type`,
      [firstname, lastname, email, username, hashed, plan_type]
    );

    console.log('[Auth: register] สมัครสมาชิกสำเร็จ! User:', result.rows[0]);
    return res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('--- [AuthController: register] เกิดข้อผิดพลาด ---');
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    return res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  console.log('--- [AuthController: login] เริ่มต้น ---');
  try {
    let { username, password } = req.body || {};
    username = normalizeUsername(username);

    console.log('[Auth: login] ข้อมูลที่ได้รับ:', { username }); // ⚠️ ห้าม Log รหัสผ่าน

    if (!username || !password) {
      console.warn('[Auth: login] Validation Failed: ข้อมูลไม่ครบ');
      return res.status(400).json({ error: 'username and password are required' });
    }

    console.log(`[Auth: login] กำลังค้นหา User: ${username}`);
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (!result.rows.length) {
      console.warn('[Auth: login] Error: ไม่พบ User นี้');
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    console.log('[Auth: login] พบ User, กำลังเปรียบเทียบรหัสผ่าน...');
    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      console.warn('[Auth: login] Error: รหัสผ่านไม่ถูกต้อง');
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    console.log('[Auth: login] รหัสผ่านถูกต้อง');
    if (!process.env.JWT_SECRET) {
      console.error('[Auth: login] Error: JWT_SECRET ไม่ได้ตั้งค่าใน .env');
      return res.status(500).json({ error: 'JWT secret not configured' });
    }

    console.log('[Auth: login] กำลังสร้าง Token...');
    
    // ⭐️⭐️⭐️⭐️⭐️ 1. แก้ไขจุดนี้ ⭐️⭐️⭐️⭐️⭐️
    // เปลี่ยน Key จาก { userId: user.id } เป็น { id: user.id }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // ⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️

    const userResponse = {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      username: user.username,
      plan_type: user.plan_type
    };

    console.log('[Auth: login] Login สำเร็จ, กำลังส่ง Token และ User');
    res.json({ token, user: userResponse });

  } catch (err) {
    console.error('--- [AuthController: login] เกิดข้อผิดพลาด ---');
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const getMe = async (req, res) => {
  console.log('--- [AuthController: getMe] เริ่มต้น ---');
  try {

    // ⭐️⭐️⭐️⭐️⭐️ 2. แก้ไขจุดนี้ ⭐️⭐️⭐️⭐️⭐️
    // เปลี่ยน Key ที่ใช้ดึงจาก req.user.userId เป็น req.user.id
    const userId = req.user.id; // 👈 ได้มาจาก authMiddleware
    // ⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️

    console.log(`[Auth: getMe] กำลังดึงข้อมูล User ID: ${userId}`);

    const { rows } = await pool.query(
      'SELECT id, firstname, lastname, email, username, plan_type, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (!rows.length) {
      console.warn(`[Auth: getMe] Error: ไม่พบ User ID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[Auth: getMe] ดึงข้อมูล User สำเร็จ:', rows[0]);
    res.json(rows[0]);

  } catch (err) {
    console.error('--- [AuthController: getMe] เกิดข้อผิดพลาด ---');
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, getMe };