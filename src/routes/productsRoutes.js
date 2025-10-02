const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');

// 1. Importar el middleware de autenticación (asume que está en la misma carpeta que Multer)
const auth = require('../middlewares/authMiddleware');

module.exports = (upload) => {
    // Rutas GET específicas 
    
    // [PROTEGIDA] Mostrar formulario de creación de producto
    router.get('/createProduct', auth, productsController.getCreateProduct);
    
    // [PROTEGIDA] Mostrar formulario de edición de producto
    router.get('/editProduct/:id', auth, productsController.getEditProduct);
    
    // [PÚBLICA] Buscar producto (Generalmente pública)
    router.get('/buscar-producto', productsController.getSearchProduct);
    
    // [PÚBLICA] Listado de productos
    router.get('/', productsController.getProducts);

    // Rutas POST 
    
    // [PROTEGIDA] Procesar la creación de producto (requiere auth y upload)
    router.post('/createProduct', auth, upload.single('productImage'), productsController.postCreateProduct);
    
    // [PROTEGIDA] Procesar la edición de producto (requiere auth y upload)
    router.post('/editProduct/:id', auth, upload.single('productImage'), productsController.postEditProduct);
    
    // [PROTEGIDA] Procesar la eliminación de producto
    router.post('/deleteProduct/:id', auth, productsController.postDeleteProduct);

    // Ruta GET genérica (va al final para evitar conflictos)
    router.get('/:slug', productsController.getProductDetail);

    return router;
};
