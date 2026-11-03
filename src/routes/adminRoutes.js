const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middlewares/adminAuthMiddleware');

// Login
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.logout);

// Dashboard
router.get('/', adminAuth, adminController.getDashboard);

module.exports = router;
