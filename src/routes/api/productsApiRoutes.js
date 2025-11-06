const express = require('express');
const router = express.Router();
const productsApiController = require('../../controllers/api/productsApiController');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Endpoints para gestión de productos
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listado de todos los productos o búsqueda por nombre (?q=)
 *     tags: [Products]
 *     parameters:
 *       - name: q
 *         in: query
 *         required: false
 *         description: Filtra productos por coincidencia parcial en el nombre
 *         schema:
 *           type: string
 *           example: pelota
 *     responses:
 *       200:
 *         description: Lista de productos devuelta correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Pelota Mikasa"
 *                       price:
 *                         type: number
 *                         example: 25000
 *                       image:
 *                         type: string
 *                         example: "/img/products/mikasa-v200w.jpg"
 *                       detail:
 *                         type: string
 *                         example: "/api/products/1"
 */
router.get('/', productsApiController.list);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtiene el detalle de un producto específico
 *     tags: [Products]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del producto
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del producto encontrado
 */
router.get('/:id', productsApiController.detail);

module.exports = router;
