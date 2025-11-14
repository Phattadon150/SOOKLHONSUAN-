// controllers/farmController.js

const pool = require('../db');

// --- 1. สร้างฟาร์ม ---
const createFarm = async (req, res) => {
  console.log('--- [FarmController: createFarm] เริ่มต้น ---');
  try {
    // ⭐️ (แก้ไข) 1. เปลี่ยนจาก .userId เป็น .id
    const userId = req.user.id;
    const { name, crop_type_id } = req.body;
    console.log(`[Farm: create] UserID: ${userId}, Body:`, req.body);

    if (!name || !crop_type_id) {
      console.warn('[Farm: create] Validation Failed: ข้อมูลไม่ครบ');
      return res.status(400).json({ error: 'name and crop_type_id are required' });
    }

    console.log('[Farm: create] กำลังบันทึก Farm ลงฐานข้อมูล...');
    const { rows } = await pool.query(
      `INSERT INTO farms (user_id, name, crop_type_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, crop_type_id`,
      [userId, name, crop_type_id]
      
    );

    if (!rows[0] || !rows[0].id) {
       console.error('[Farm: create] Error: สร้างฟาร์มไม่สำเร็จ หรือไม่ได้ ID กลับมา');
       return res.status(500).json({ error: 'Failed to create farm or retrieve ID' });
        
    }

    console.log('[Farm: create] สร้าง Farm สำเร็จ, กำลังส่งข้อมูลกลับ:', rows[0]);
    res.status(201).json(rows[0]);

  } catch (err) {
    console.error('--- [FarmController: createFarm] เกิดข้อผิดพลาด ---');
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// --- 2. ดึงฟาร์มทั้งหมด ---
const getFarms = async (req, res) => {
  console.log('--- [FarmController: getFarms] เริ่มต้น ---');
  try {
    // ⭐️ (แก้ไข) 2. เปลี่ยนจาก .userId เป็น .id
    const userId = req.user.id;
    console.log(`[Farm: getFarms] กำลังดึงฟาร์มทั้งหมดของ User ID: ${userId}`);

    const { rows } = await pool.query(
      `SELECT f.id, f.name, f.crop_type_id, c.name AS crop_name, f.created_at
       FROM farms f
       LEFT JOIN crop_types c ON f.crop_type_id = c.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    console.log(`[Farm: getFarms] พบฟาร์มจำนวน: ${rows.length} แห่ง`);
    res.json(rows);

  } catch (err) {
    console.error('--- [FarmController: getFarms] เกิดข้อผิดพลาด ---');
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


// --- 3. ดึงฟาร์มทีละตัว (By ID) ---
const getFarmById = async (req, res) => {
  console.log('--- [FarmController: getFarmById] เริ่มต้น ---');
  try {
    // ⭐️ (แก้ไข) 3. เปลี่ยนจาก .userId เป็น .id
    const userId = req.user.id;
    const { id } = req.params;
    console.log(`[Farm: getById] UserID: ${userId}, FarmID (จาก URL): ${id}`);

    const farmId = parseInt(id, 10);
    
    if (isNaN(farmId) || farmId <= 0) {
      console.warn(`[Farm: getById] Error: Farm ID ไม่ถูกต้อง: ${id}`);
      return res.status(400).json({ error: 'Invalid Farm ID format' });
    }

    const { rows } = await pool.query(
      `SELECT f.id, f.name, f.crop_type_id, c.name AS crop_name, f.created_at
       FROM farms f
       LEFT JOIN crop_types c ON f.crop_type_id = c.id
       WHERE f.id = $1 AND f.user_id = $2`,
      [farmId, userId]
    );

    if (!rows.length) {
      console.warn(`[Farm: getById] Error: ไม่พบ Farm ID: ${farmId} ของ User: ${userId}`);
      return res.status(404).json({ error: 'Farm not found' });
    }

    console.log('[Farm: getById] พบฟาร์ม:', rows[0]);
    res.json(rows[0]);

  } catch (err) {
    console.error('--- [FarmController: getFarmById] เกิดข้อผิดพลาด ---');
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// --- 4. อัปเดตฟาร์ม ---
const updateFarm = async (req, res) => {
  console.log('--- [FarmController: updateFarm] เริ่มต้น ---');
  try {
    // ⭐️ (แก้ไข) 4. เปลี่ยนจาก .userId เป็น .id
    const userId = req.user.id;
    const { id } = req.params;
    const { name, crop_type_id } = req.body;
    console.log(`[Farm: update] UserID: ${userId}, FarmID: ${id}, Body:`, req.body);

    const farmId = parseInt(id, 10);
    if (isNaN(farmId) || farmId <= 0) {
      return res.status(400).json({ error: 'Invalid Farm ID format' });
    }

    const { rows } = await pool.query(
      `UPDATE farms
       SET name = COALESCE($1, name),
           crop_type_id = COALESCE($2, crop_type_id)
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, crop_type_id`,
      [name, crop_type_id, farmId, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Farm not found or not yours' });
    }

    console.log('[Farm: update] อัปเดตฟาร์มสำเร็จ:', rows[0]);
    res.json(rows[0]);

  } catch (err) {
    console.error('--- [FarmController: updateFarm] เกิดข้อผิดพลาด ---');
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// --- 5. ลบฟาร์ม ---
const deleteFarm = async (req, res) => {
  console.log('--- [FarmController: deleteFarm] เริ่มต้น ---');
  const client = await pool.connect(); // ⭐️ 1. เปิด Transaction
  try {
    const userId = req.user.id;
    const { id } = req.params;
    console.log(`[Farm: delete] UserID: ${userId}, FarmID: ${id}`);

    const farmId = parseInt(id, 10);
    if (isNaN(farmId) || farmId <= 0) {
      return res.status(400).json({ error: 'Invalid Farm ID format' });
    }
    
    // เริ่มต้น Transaction เพื่อให้แน่ใจว่าทั้ง 2 คำสั่งสำเร็จพร้อมกัน
    await client.query('BEGIN'); 

    // ⭐️ 2. ลบข้อมูลการคำนวณที่เกี่ยวข้องก่อน
    console.log(`[Farm: delete] กำลังลบประวัติการคำนวณทั้งหมดของ Farm ID: ${farmId}`);
    // เราไม่จำเป็นต้องตรวจสอบ user_id ที่นี่ เพราะ calculations เชื่อมโยงกับ farm_id อยู่แล้ว
    await client.query(
      'DELETE FROM calculations WHERE farm_id = $1',
      [farmId]
    );
    console.log(`[Farm: delete] ลบประวัติการคำนวณเรียบร้อย`);

    // ⭐️ 3. ลบข้อมูลฟาร์ม (ตารางหลัก)
    console.log(`[Farm: delete] กำลังลบ Farm ID: ${farmId}`);
    const result = await client.query(
      'DELETE FROM farms WHERE id = $1 AND user_id = $2',
      [farmId, userId]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK'); // Rollback ถ้าไม่พบฟาร์ม
      return res.status(404).json({ error: 'Farm not found or not yours' });
    }

    await client.query('COMMIT'); // ⭐️ 4. ยืนยัน Transaction (สำเร็จ)
    
    console.log(`[Farm: delete] ลบ Farm ID: ${farmId} สำเร็จ`);
    res.json({ message: 'Farm and related calculations deleted successfully' });

  } catch (err) {
    // ⭐️ 5. Rollback หากมีข้อผิดพลาดใดๆ เกิดขึ้น
    await client.query('ROLLBACK');
    console.error('--- [FarmController: deleteFarm] เกิดข้อผิดพลาด ---');
    console.error(err);
    // ตรวจสอบข้อผิดพลาดเฉพาะเจาะจง (ถ้ามี)
    res.status(500).json({ error: 'Failed to delete farm due to a database error.' });
  } finally {
    // ⭐️ 6. คืน Client ให้ Pool
    client.release();
    console.log('--- [FarmController: deleteFarm] สิ้นสุด ---');
  }
};


// ⭐️ (แก้ไข) 6. แก้ไข module.exports ให้ครบ (โค้ดเดิมของคุณถูกต้องแล้ว)
module.exports = {
  createFarm,
  getFarms,
  getFarmById,
  updateFarm,
  deleteFarm
};