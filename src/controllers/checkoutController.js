const { Op } = require('sequelize');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { sequelize, Product, ProductVariant, Order, OrderItem } = require('../../models');

const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const mpClient = () => new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// Tiempo que un pedido tiene apartado el stock esperando el pago
const RESERVATION_MINUTES = 30;

const SHIPPING_FIELDS = { shipping_name: 100, shipping_phone: 30, shipping_address: 150, shipping_city: 80, shipping_province: 50, shipping_zip: 10 };

// Datos de envío obligatorios (las notas son opcionales); devuelve null si falta alguno
const parseShipping = (body) => {
  const data = {};
  for (const [field, max] of Object.entries(SHIPPING_FIELDS)) {
    const value = String(body[field] || '').trim();
    if (!value || value.length > max) return null;
    data[field] = value;
  }
  data.shipping_notes = String(body.shipping_notes || '').trim().slice(0, 500) || null;
  return data;
};

// Convierte el carrito del navegador en [{ id, quantity, size }] válidos; descarta todo lo demás
const parseCart = (raw) => {
  let cart;
  try { cart = JSON.parse(raw); } catch { return []; }
  if (!Array.isArray(cart)) return [];
  return cart
    .map(item => ({ id: parseInt(item.id, 10), quantity: parseInt(item.quantity, 10), size: item.size ? String(item.size) : null }))
    .filter(item => item.id > 0 && item.quantity > 0 && item.quantity <= 99);
};

class OutOfStockError extends Error {
  constructor(item) {
    super(`Sin stock: ${item.name}`);
    this.item = item;
  }
}

// Descuenta solo si alcanza, en una única sentencia (UPDATE ... WHERE stock >= cantidad).
// Así dos compras simultáneas nunca pueden llevarse la misma unidad.
const takeStock = async (Model, id, quantity, transaction) => {
  const [changed] = await Model.update(
    { stock: sequelize.literal(`stock - ${Number(quantity)}`) },
    { where: { id, stock: { [Op.gte]: quantity } }, transaction }
  );
  return changed === 1;
};

// Aparta todas las líneas o ninguna (si una falla, la transacción se deshace entera)
const reserveItems = async (items, transaction) => {
  for (const item of items) {
    if (item.variant_id && !(await takeStock(ProductVariant, item.variant_id, item.quantity, transaction))) throw new OutOfStockError(item);
    if (item.product_id && !(await takeStock(Product, item.product_id, item.quantity, transaction))) throw new OutOfStockError(item);
  }
};

// Devuelve las unidades apartadas. El UPDATE condicional sobre stock_reserved hace que corra una sola vez.
const releaseStock = async (order, transaction) => {
  const [changed] = await Order.update({ stock_reserved: false }, { where: { id: order.id, stock_reserved: true }, transaction });
  if (changed === 0) return;
  for (const item of order.items) {
    if (item.variant_id) await ProductVariant.increment('stock', { by: item.quantity, where: { id: item.variant_id }, transaction });
    if (item.product_id) await Product.increment('stock', { by: item.quantity, where: { id: item.product_id }, transaction });
  }
};

// Libera el stock de pedidos que pasaron su plazo sin un pago en curso
const releaseExpiredOrders = async () => {
  const expired = await Order.findAll({
    where: { stock_reserved: true, status: { [Op.in]: ['pending', 'rejected'] }, expires_at: { [Op.lt]: new Date() } },
    include: ['items']
  });
  for (const order of expired) {
    await sequelize.transaction(async (transaction) => {
      await releaseStock(order, transaction);
      await order.update({ status: 'expired' }, { transaction });
    });
  }
};

// Trae el pago desde Mercado Pago (la única fuente confiable) y actualiza el pedido.
// La usan el webhook y la página de vuelta, así que tiene que ser segura si corre dos veces o a la vez.
const syncPayment = async (paymentId) => {
  const payment = await new Payment(mpClient()).get({ id: paymentId });
  const order = await Order.findByPk(payment.external_reference, { include: ['items'] });
  if (!order) return null;

  const fields = { payment_id: String(payment.id), email: order.email || payment.payer?.email || null };

  if (payment.status === 'approved') {
    if (Number(payment.transaction_amount) < Number(order.total)) {
      console.warn(`Pedido ${order.id}: pago de $${payment.transaction_amount} menor al total $${order.total}`);
      await order.update({ ...fields, status: 'review' });
      return order.reload();
    }
    try {
      await sequelize.transaction(async (transaction) => {
        // Si la reserva ya se había liberado (pago tardío), hay que volver a apartar el stock
        const [retake] = await Order.update({ stock_reserved: true }, { where: { id: order.id, stock_reserved: false }, transaction });
        if (retake === 1) await reserveItems(order.items, transaction);
        await order.update({ ...fields, status: 'approved', expires_at: null }, { transaction });
      });
    } catch (error) {
      if (!(error instanceof OutOfStockError)) throw error;
      // Pagado pero ya no hay stock: queda para que el admin lo devuelva o lo resuelva
      console.warn(`Pedido ${order.id} pagado sin stock disponible`);
      await order.update({ ...fields, status: 'review' });
    }
  } else if (['cancelled', 'refunded', 'charged_back'].includes(payment.status)) {
    await sequelize.transaction(async (transaction) => {
      await releaseStock(order, transaction);
      await order.update({ ...fields, status: payment.status }, { transaction });
    });
  } else if (order.status !== 'approved') {
    // pending / in_process: hay un pago en curso (por ejemplo en efectivo), se mantiene la reserva sin vencimiento.
    // rejected: el comprador puede reintentar con otra tarjeta; la reserva vence a su hora.
    const keep = ['pending', 'in_process'].includes(payment.status) ? { expires_at: null } : {};
    await order.update({ ...fields, ...keep, status: payment.status });
  }

  return order.reload();
};

const checkoutController = {
  // POST /checkout: guarda el pedido con precios de la base (nunca los del navegador), aparta el stock y redirige a Mercado Pago
  createPreference: async (req, res) => {
    if (!process.env.MP_ACCESS_TOKEN) {
      return res.status(503).render('users/error', { message: 'El pago con Mercado Pago todavía no está configurado. Podés hacer tu pedido por WhatsApp.' });
    }

    const cart = parseCart(req.body.cart);
    if (cart.length === 0) return res.redirect('/cart');
    const shipping = parseShipping(req.body);
    if (!shipping) {
      return res.status(400).render('users/error', { message: 'Completá todos los datos de envío para continuar.' });
    }

    let order;
    try {
      await releaseExpiredOrders();
      const products = await Product.findAll({ where: { id: cart.map(i => i.id) }, include: ['variants'] });

      const items = [];
      for (const { id, quantity, size } of cart) {
        const product = products.find(p => p.id === id);
        if (!product) continue;
        const variant = product.variants.find(v => v.size === size);
        if (product.variants.length && !variant) {
          return res.status(400).render('users/error', { message: `Elegí un talle válido para "${product.name}".` });
        }
        items.push({
          product_id: product.id,
          variant_id: variant ? variant.id : null,
          name: product.name,
          size: variant ? variant.size : null,
          unit_price: product.price,
          quantity,
          image: product.image
        });
      }
      if (items.length === 0) return res.redirect('/cart');

      const user = req.session.userLogged;
      order = await sequelize.transaction(async (transaction) => {
        await reserveItems(items, transaction);
        const created = await Order.create({
          user_id: user ? user.id : null,
          email: user ? user.email : null,
          ...shipping,
          total: items.reduce((sum, i) => sum + Number(i.unit_price) * i.quantity, 0),
          stock_reserved: true,
          expires_at: new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000)
        }, { transaction });
        await OrderItem.bulkCreate(items.map(({ image, ...item }) => ({ ...item, order_id: created.id })), { transaction });
        return created;
      });

      const body = {
        items: items.map(i => ({
          id: String(i.product_id),
          title: i.size ? `${i.name} (Talle ${i.size})` : i.name,
          quantity: i.quantity,
          unit_price: Number(i.unit_price),
          currency_id: 'ARS',
          picture_url: i.image && i.image.startsWith('/') ? baseUrl + i.image : undefined
        })),
        external_reference: String(order.id),
        back_urls: {
          success: `${baseUrl}/checkout/success`,
          failure: `${baseUrl}/checkout/failure`,
          pending: `${baseUrl}/checkout/pending`
        },
        // El link de pago vence junto con la reserva
        expires: true,
        expiration_date_to: order.expires_at.toISOString(),
        statement_descriptor: 'ZONA6'
      };
      // Mercado Pago rechaza auto_return y notification_url que no son https (por ejemplo localhost)
      if (baseUrl.startsWith('https://')) {
        body.auto_return = 'approved';
        body.notification_url = `${baseUrl}/checkout/webhook`;
      }
      if (user) body.payer = { email: user.email };

      const preference = await new Preference(mpClient()).create({ body });
      res.redirect(303, preference.init_point);
    } catch (error) {
      if (error instanceof OutOfStockError) {
        const { item } = error;
        const current = item.variant_id ? await ProductVariant.findByPk(item.variant_id) : await Product.findByPk(item.product_id);
        const label = item.size ? `${item.name} talle ${item.size}` : item.name;
        return res.status(400).render('users/error', { message: `No hay stock suficiente de "${label}" (quedan ${current ? current.stock : 0}).` });
      }
      console.error('Error creando preferencia de Mercado Pago:', error);
      if (order) {
        // Mercado Pago falló después de reservar: devolver el stock
        await sequelize.transaction(async (transaction) => {
          await releaseStock(await Order.findByPk(order.id, { include: ['items'], transaction }), transaction);
          await Order.update({ status: 'cancelled' }, { where: { id: order.id }, transaction });
        }).catch(e => console.error('Error liberando stock:', e));
      }
      res.status(502).render('users/error', { message: 'No pudimos conectar con Mercado Pago. Intentá de nuevo en unos minutos.' });
    }
  },

  // GET /checkout/:status: página de vuelta desde Mercado Pago
  result: (status) => async (req, res) => {
    let order = null;
    const paymentId = req.query.payment_id && req.query.payment_id !== 'null' ? req.query.payment_id : null;
    // En localhost el webhook no llega, así que también sincronizamos acá
    if (paymentId && process.env.MP_ACCESS_TOKEN) {
      try { order = await syncPayment(paymentId); } catch (error) { console.error('Error sincronizando pago:', error); }
    }
    res.render('users/checkoutResult', { status, paymentId, order });
  },

  // POST /checkout/webhook: aviso de Mercado Pago (llega como ?type=payment&data.id=... o en el body)
  webhook: async (req, res) => {
    const type = req.body?.type || req.query.type || req.query.topic;
    const id = req.body?.data?.id || req.query['data.id'] || req.query.id;
    if (type !== 'payment' || !id || !process.env.MP_ACCESS_TOKEN) return res.sendStatus(200);

    try {
      await syncPayment(id);
      res.sendStatus(200);
    } catch (error) {
      // 500 hace que Mercado Pago reintente más tarde
      console.error('Error procesando webhook de Mercado Pago:', error);
      res.sendStatus(500);
    }
  }
};

// Revisa cada 5 minutos si hay reservas vencidas (unref: no impide que el proceso termine)
setInterval(() => releaseExpiredOrders().catch(e => console.error('Error liberando reservas vencidas:', e)), 5 * 60 * 1000).unref();

checkoutController.syncPayment = syncPayment;
checkoutController.releaseExpiredOrders = releaseExpiredOrders;
module.exports = checkoutController;
