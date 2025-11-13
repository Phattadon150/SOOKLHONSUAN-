const express = require('express');
const router = express.Router();
const cropTypeController = require('../controllers/cropTypeController');

router.get('/', cropTypeController.getCropTypes);

module.exports = router;
