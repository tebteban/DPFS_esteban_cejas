const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController'); // Importamos el controlador

// Asociamos cada URL con su método correspondiente del controlador
router.get('/', mainController.getHome);
router.get('/login', mainController.getLogin);
router.get('/register', mainController.getRegister);
router.get('/cart', mainController.getCart);

module.exports = router;