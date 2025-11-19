const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

const upload = require('../middlewares/multerUsers');
const guest = require('../middlewares/guestMiddleware');
const auth = require('../middlewares/authMiddleware');
const { registerValidation, loginValidation } = require('../validations/userValidations');

// Registro
router.get('/register', guest, usersController.register);
router.post('/register', upload.single('image'), registerValidation, usersController.store);

// Login
router.get('/login', guest, usersController.login);
router.post('/login', loginValidation, usersController.loginProcess);

// Perfil y logout
router.get('/profile', auth, usersController.profile);
router.get('/logout', usersController.logout);

module.exports = router;
