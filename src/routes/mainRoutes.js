const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController'); // Importamos el controlador

// Asociamos cada URL con su método correspondiente del controlador
router.get('/', mainController.getHome);
router.get('/login', (req, res) => res.redirect('/users/login'));
router.get('/register', (req, res) => res.redirect('/users/register'));
router.get('/cart', mainController.getCart);

module.exports = router;