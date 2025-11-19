const { body } = require('express-validator');
const { User } = require('../../models');

const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres.'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('El apellido es obligatorio.')
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres.'),
  body('email')
    .trim()
    .normalizeEmail()
    .isEmail().withMessage('Debes ingresar un email válido.')
    .bail()
    .custom(async email => {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new Error('Este email ya está registrado.');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/[A-Z]/).withMessage('La contraseña debe incluir al menos una letra mayúscula.')
    .matches(/[a-z]/).withMessage('La contraseña debe incluir al menos una letra minúscula.')
    .matches(/[0-9]/).withMessage('La contraseña debe incluir al menos un número.')
];

const loginValidation = [
  body('email')
    .trim()
    .normalizeEmail()
    .notEmpty().withMessage('Debes ingresar un email.')
    .bail()
    .isEmail().withMessage('Debes ingresar un email válido.'),
  body('password')
    .notEmpty().withMessage('Debes ingresar tu contraseña.')
];

module.exports = {
  registerValidation,
  loginValidation
};