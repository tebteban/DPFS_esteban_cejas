const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

router.post('/', checkoutController.createPreference);
router.post('/webhook', checkoutController.webhook);
router.get('/success', checkoutController.result('success'));
router.get('/failure', checkoutController.result('failure'));
router.get('/pending', checkoutController.result('pending'));

module.exports = router;
