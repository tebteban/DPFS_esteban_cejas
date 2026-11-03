const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
// Crear/editar/borrar productos es solo para administradores
const auth = require('../middlewares/adminAuthMiddleware');
const { createProductValidation, updateProductValidation } = require('../validations/productValidations');

module.exports = (upload) => {
  // Foto principal + hasta 6 fotos de galería; req.file queda como antes para la validación y el controlador
  const productUploads = [
    upload.fields([{ name: 'productImage', maxCount: 1 }, { name: 'galleryImages', maxCount: 6 }]),
    (req, res, next) => { req.file = req.files?.productImage?.[0]; next(); }
  ];

  // --- RUTAS PÚBLICAS ---
  router.get('/', productsController.getProducts);
  router.get('/buscar-producto', productsController.getSearchProduct);

  // --- RUTAS QUE DEBEN IR ANTES DE /:id ---
  router.get('/createProduct', auth, productsController.getCreateProduct);
  router.post(
    '/createProduct',
    auth,
    productUploads,
    createProductValidation,
    productsController.postCreateProduct
  );

  router.get('/editProduct/:id', auth, productsController.getEditProduct);
  router.post(
    '/editProduct/:id',
    auth,
    productUploads,
    updateProductValidation,
    productsController.postEditProduct
  );

  router.post('/deleteProduct/:id', auth, productsController.postDeleteProduct);

  // --- ESTA SIEMPRE ÚLTIMA ---
  router.get('/:id', productsController.getProductDetail);

  return router;
};