const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { getMe } = require('../controllers/authController');

router.get('/profile', requireAuth, getMe);

module.exports = router;
