const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const auth = require('../middlewares/authMiddleware');

module.exports = (upload) => {
  // --- RUTAS PÚBLICAS ---
  router.get('/', productsController.getProducts);
  router.get('/buscar-producto', productsController.getSearchProduct); // antes de /:id
  router.get('/:id', productsController.getProductDetail);

  // --- RUTAS PROTEGIDAS ---
  router.get('/createProduct', auth, productsController.getCreateProduct);
  router.post('/createProduct', auth, upload.single('productImage'), productsController.postCreateProduct);
  router.get('/editProduct/:id', auth, productsController.getEditProduct);
  router.post('/editProduct/:id', auth, upload.single('productImage'), productsController.postEditProduct);
  router.post('/deleteProduct/:id', auth, productsController.postDeleteProduct);

  return router;
};
