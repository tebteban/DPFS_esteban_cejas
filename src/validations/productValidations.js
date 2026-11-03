const { body } = require('express-validator');
const path = require('path');

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

// Filas "talle | cantidad" del formulario -> [{ size, stock }]; vacío = talle único
const parseVariants = (body) => {
  const sizes = [].concat(body.variant_size || []);
  const stocks = [].concat(body.variant_stock || []);
  return sizes
    .map((size, i) => ({ size: String(size).trim().toUpperCase(), stock: Number(stocks[i]) }))
    .filter(v => v.size);
};

const variantsValidation = body('variant_size').custom((value, { req }) => {
  const variants = parseVariants(req.body);
  if (variants.length > 20) throw new Error('Podés cargar hasta 20 talles.');
  for (const v of variants) {
    if (v.size.length > 20 || !/^[\p{L}\d ./-]+$/u.test(v.size)) throw new Error(`El talle "${v.size}" tiene caracteres inválidos.`);
    if (!Number.isInteger(v.stock) || v.stock < 0 || v.stock > 100000) throw new Error(`La cantidad del talle ${v.size} tiene que ser un número entero de 0 o más.`);
  }
  if (new Set(variants.map(v => v.size)).size !== variants.length) throw new Error('Hay talles repetidos.');
  return true;
});

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
  // Con talles, el stock total es la suma de cada talle y este campo no se usa
  body('stock')
    .if((value, { req }) => parseVariants(req.body).length === 0)
    .notEmpty().withMessage('El stock es obligatorio.')
    .bail()
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero mayor o igual a 0.'),
  variantsValidation,
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
    throw new Error('Debes subir una imagen del producto (JPG, PNG o WEBP, hasta 2MB).');
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
  parseVariants,
  createProductValidation,
  updateProductValidation
};