const express = require('express');
const router = express.Router();
const usersApiController = require('../../controllers/api/usersApiController');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints para gestión de usuarios
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listado de todos los usuarios
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuarios devuelta correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Esteban Cejas"
 *                       email:
 *                         type: string
 *                         example: "esteban@spikeshop.com"
 *                       detail:
 *                         type: string
 *                         example: "/api/users/1"
 */
router.get('/', usersApiController.list);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtiene el detalle de un usuario específico
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del usuario
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del usuario encontrado
 */
router.get('/:id', usersApiController.detail);

module.exports = router;
