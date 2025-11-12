const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

const requireAuth = require('../middleware/auth');
router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await require('../db').query(
    'SELECT id, firstname, lastname, email, plan_type FROM users WHERE id = $1',
    [req.user.userId]
  );
  if (!rows.length) return res.status(404).json({ error: "User not found" });
  res.json(rows[0]);
});

module.exports = router;
