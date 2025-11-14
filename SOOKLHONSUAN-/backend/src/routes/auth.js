const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/google', authController.googleLogin);
router.post('/google/complete', authController.googleCompleteSignup);

router.get('/check-username', authController.checkUsername);

module.exports = router;
