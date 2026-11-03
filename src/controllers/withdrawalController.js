const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { WithdrawalRequest } = require('../../models');

const withdrawalValidation = [
  body('name').trim().notEmpty().withMessage('Ingresá tu nombre.').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Ingresá un email válido.').isLength({ max: 120 }),
  body('order_id').optional({ values: 'falsy' }).trim().isInt({ min: 1 }).withMessage('El número de pedido tiene que ser un número.'),
  body('reason').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('El motivo no puede superar los 1000 caracteres.')
];

const withdrawalController = {
  // GET /arrepentimiento
  form: (req, res) => {
    const user = req.session.userLogged;
    res.render('users/withdrawal', {
      errors: [],
      oldData: user ? { name: `${user.firstName} ${user.lastName}`, email: user.email } : {},
      code: null
    });
  },

  // POST /arrepentimiento: registra la solicitud y le da al cliente un código de seguimiento
  submit: [...withdrawalValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('users/withdrawal', { errors: errors.array(), oldData: req.body, code: null });
    }

    const request = await WithdrawalRequest.create({
      code: 'ARR-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      order_id: req.body.order_id ? parseInt(req.body.order_id, 10) : null,
      name: req.body.name,
      email: req.body.email,
      reason: req.body.reason || null
    });

    res.render('users/withdrawal', { errors: [], oldData: {}, code: request.code });
  }]
};

module.exports = withdrawalController;
