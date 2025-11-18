const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth'); 

const { 
  previewCalculation, 
  createCalculation, 
  getCalculationsByUser,
  deleteCalculation,
  updateCalculation
} = require('../controllers/calculation.Controller');

router.get('/', authMiddleware, getCalculationsByUser);
router.post('/', authMiddleware, createCalculation);
router.post('/preview', authMiddleware, previewCalculation);
router.delete('/:id', authMiddleware, deleteCalculation); 
router.put('/:id', authMiddleware, updateCalculation);

module.exports = router;
