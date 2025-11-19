const { body } = require('express-validator');
const path = require('path');

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const baseProductValidation = [
  body('productName')
    .trim()
    .notEmpty().withMessage('El nombre del producto es obligatorio.')
    .isLength({ min: 3, max: 120 }).withMessage('El nombre debe tener entre 3 y 120 caracteres.'),
  body('description')
    .trim()
    .notEmpty().withMessage('La descripción es obligatoria.')
    .isLength({ min: 10, max: 1000 }).withMessage('La descripción debe tener entre 10 y 1000 caracteres.'),
  body('price')
    .notEmpty().withMessage('El precio es obligatorio.')
    .bail()
    .isFloat({ gt: 0 }).withMessage('El precio debe ser un número mayor que cero.'),
  body('stock')
    .notEmpty().withMessage('El stock es obligatorio.')
    .bail()
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero mayor o igual a 0.'),
  body('category_id')
    .notEmpty().withMessage('Debes seleccionar una categoría.')
    .bail()
    .isInt({ min: 1 }).withMessage('La categoría es inválida.'),
  body('brand_id')
    .notEmpty().withMessage('Debes seleccionar una marca.')
    .bail()
    .isInt({ min: 1 }).withMessage('La marca es inválida.')
];

const validateImage = (isOptional = false) => body('productImage').custom((value, { req }) => {
  if (!req.file || !req.file.originalname) {
    if (isOptional) return true;
    throw new Error('Debes subir una imagen del producto.');
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(req.file.mimetype)) {
    throw new Error('La imagen debe ser JPG, JPEG, PNG o WEBP.');
  }
  return true;
});

const createProductValidation = [...baseProductValidation, validateImage(false)];
const updateProductValidation = [...baseProductValidation, validateImage(true)];

module.exports = {
  createProductValidation,
  updateProductValidation
};