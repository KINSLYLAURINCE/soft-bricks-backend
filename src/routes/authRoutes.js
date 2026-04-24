const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authValidator = require('../validators/authValidator');
const { authenticate } = require('../../middleware/auth');

router.post('/login', authValidator.login, authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authValidator.updateProfile, authController.updateProfile);
router.put('/change-password', authenticate, authValidator.changePassword, authController.changePassword);
router.get('/admins', authenticate, authController.getAllAdmins);

module.exports = router;