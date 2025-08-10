

const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');

module.exports = (upload) => {
    // Rutas GET específicas 
    router.get('/createProduct', productsController.getCreateProduct);
    router.get('/editProduct/:id', productsController.getEditProduct);
    router.get('/buscar-producto', productsController.getSearchProduct);
    router.get('/', productsController.getProducts);

    // Rutas POST 
    router.post('/createProduct', upload.single('productImage'), productsController.postCreateProduct);
    router.post('/editProduct/:id', upload.single('productImage'), productsController.postEditProduct);
    router.post('/deleteProduct/:id', productsController.postDeleteProduct);

    // Ruta GET genérica (va al final para evitar conflictos)
    router.get('/:slug', productsController.getProductDetail);

    return router;
};