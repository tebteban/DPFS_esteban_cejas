const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const auth = require('../middlewares/authMiddleware');
const { createProductValidation, updateProductValidation } = require('../validations/productValidations');

module.exports = (upload) => {

  // --- RUTAS PÚBLICAS ---
  router.get('/', productsController.getProducts);
  router.get('/buscar-producto', productsController.getSearchProduct);

  // --- RUTAS QUE DEBEN IR ANTES DE /:id ---
  router.get('/createProduct', auth, productsController.getCreateProduct);
  router.post(
    '/createProduct',
    auth,
    upload.single('productImage'),
    createProductValidation,
    productsController.postCreateProduct
  );

  router.get('/editProduct/:id', auth, productsController.getEditProduct);
  router.post(
    '/editProduct/:id',
    auth,
    upload.single('productImage'),
    updateProductValidation,
    productsController.postEditProduct
  );

  router.post('/deleteProduct/:id', auth, productsController.postDeleteProduct);

  // --- ESTA SIEMPRE ÚLTIMA ---
  router.get('/:id', productsController.getProductDetail);

  return router;
};