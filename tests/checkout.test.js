// Reglas del checkout y del webhook de Mercado Pago. Correr con: npm test
const test = require('node:test');
const assert = require('node:assert');
const { startApp, checkout, shipping } = require('./helpers');

let app;
test.before(async () => { app = await startApp(); });
test.after(() => setTimeout(() => process.exit(0), 100));

const paymentOf = (response) => new URL(response.headers.get('location')).searchParams.get('payment_id');
const orderOf = (paymentId) => app.db.Order.findByPk(Number(paymentId.replace('PAY-', '')), { include: ['items'] });
const webhook = (id) => fetch(app.baseUrl + '/checkout/webhook', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'payment', data: { id } })
});

test('el precio sale de la base, no del navegador', async () => {
  const r = await checkout(app.baseUrl, [{ id: 1, quantity: 2, price: 1 }]);
  assert.strictEqual(r.status, 303);
  const pref = app.preferences.at(-1);
  assert.strictEqual(pref.items[0].unit_price, 25900);
  assert.strictEqual(Number((await orderOf(paymentOf(r))).total), 51800);
});

test('sin datos de envío no se crea el pedido', async () => {
  const before = await app.db.Order.count();
  const r = await fetch(app.baseUrl + '/checkout', {
    method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ cart: JSON.stringify([{ id: 1, quantity: 1 }]) })
  });
  assert.strictEqual(r.status, 400);
  assert.strictEqual(await app.db.Order.count(), before);
});

test('carrito con basura vuelve al carrito sin crear nada', async () => {
  const before = await app.db.Order.count();
  for (const cart of ['no-es-json', [{ id: 'x', quantity: -1 }], [{ id: 9999, quantity: 1 }], [{ id: 1, quantity: 500 }]]) {
    const r = await fetch(app.baseUrl + '/checkout', {
      method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...shipping, cart: typeof cart === 'string' ? cart : JSON.stringify(cart) })
    });
    assert.strictEqual(r.headers.get('location'), '/cart');
  }
  assert.strictEqual(await app.db.Order.count(), before);
});

test('pago aprobado por webhook y por la página de vuelta: se aprueba una sola vez', async () => {
  await app.db.Product.update({ stock: 10 }, { where: { id: 4 } });
  const r = await checkout(app.baseUrl, [{ id: 4, quantity: 3 }]);
  const id = paymentOf(r);
  await Promise.all([webhook(id), fetch(`${app.baseUrl}/checkout/success?payment_id=${id}`), webhook(id)]);
  const order = await orderOf(id);
  assert.strictEqual(order.status, 'approved');
  assert.strictEqual(order.payment_id, id);
  assert.strictEqual((await app.db.Product.findByPk(4)).stock, 7);
});

test('un "pendiente" tardío no pisa un pedido pagado; un reembolso sí y devuelve el stock', async () => {
  await app.db.Product.update({ stock: 10 }, { where: { id: 5 } });
  const id = paymentOf(await checkout(app.baseUrl, [{ id: 5, quantity: 2 }]));
  await webhook(id);
  app.payments[id].status = 'pending';
  await webhook(id);
  assert.strictEqual((await orderOf(id)).status, 'approved');
  app.payments[id].status = 'refunded';
  await webhook(id);
  assert.strictEqual((await orderOf(id)).status, 'refunded');
  assert.strictEqual((await app.db.Product.findByPk(5)).stock, 10);
});

test('pago por menos plata que el total queda "en revisión"', async () => {
  const id = paymentOf(await checkout(app.baseUrl, [{ id: 6, quantity: 1 }]));
  app.payments[id].transaction_amount = 1;
  await webhook(id);
  assert.strictEqual((await orderOf(id)).status, 'review');
});

test('avisos que no son de pagos se ignoran', async () => {
  const r = await fetch(app.baseUrl + '/checkout/webhook', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'merchant_order', data: { id: '1' } })
  });
  assert.strictEqual(r.status, 200);
});
