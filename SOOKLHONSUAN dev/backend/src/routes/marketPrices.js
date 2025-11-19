const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/auth');
const { getLatestPrice, estimateValue } = require('../controllers/marketPrice.Controller');

router.get('/latest', requireAuth, getLatestPrice);
router.post('/estimate', requireAuth, estimateValue);

module.exports = router;
