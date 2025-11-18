const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const farmController = require('../controllers/farmController');

router.use(requireAuth);

router.post('/', farmController.createFarm);
router.get('/', farmController.getFarms);
router.get('/:id', farmController.getFarmById);
router.put('/:id', farmController.updateFarm);
router.delete('/:id', farmController.deleteFarm);

module.exports = router;
