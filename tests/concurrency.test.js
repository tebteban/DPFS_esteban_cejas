// Pruebas de concurrencia ("race conditions"): muchos compradores tocan "Pagar" al mismo tiempo por las últimas unidades.
// Correr con: npm run test:concurrency
const test = require('node:test');
const assert = require('node:assert');
const { startApp, checkout } = require('./helpers');

let app;
test.before(async () => { app = await startApp(); });
test.after(() => setTimeout(() => process.exit(0), 100));

const goPay = (responses) => Promise.all(responses.filter(r => r.status === 303).map(r => fetch(r.headers.get('location'))));

test('25 compradores, 1 remera: se la lleva uno solo y el resto ve "sin stock"', async () => {
  const { baseUrl, db } = app;
  await db.Product.update({ stock: 1 }, { where: { id: 1 } });

  const responses = await Promise.all(Array.from({ length: 25 }, () => checkout(baseUrl, [{ id: 1, quantity: 1 }])));
  const statuses = responses.map(r => r.status);

  assert.strictEqual(statuses.filter(s => s >= 500).length, 0, `errores del servidor: ${statuses.join(',')}`);
  assert.strictEqual(statuses.filter(s => s === 303).length, 1, 'más de un comprador pudo ir a pagar la misma remera');
  assert.strictEqual(statuses.filter(s => s === 400).length, 24);
  assert.match(await responses.find(r => r.status === 400).text(), /No hay stock suficiente/);

  await goPay(responses);
  assert.strictEqual((await db.Product.findByPk(1)).stock, 0);
  assert.strictEqual(await db.Order.count({ where: { status: 'approved' } }), 1);
});

test('pedidos de distinto tamaño a la vez: nunca se vende más de lo que hay', async () => {
  const { baseUrl, db } = app;
  await db.Product.update({ stock: 2 }, { where: { id: 3 } });

  const responses = await Promise.all([
    checkout(baseUrl, [{ id: 3, quantity: 2 }]),
    checkout(baseUrl, [{ id: 3, quantity: 1 }]),
    checkout(baseUrl, [{ id: 3, quantity: 1 }]),
    checkout(baseUrl, [{ id: 3, quantity: 1 }])
  ]);
  await goPay(responses);

  const sold = await db.OrderItem.sum('quantity', { where: { product_id: 3 }, include: [{ association: 'order', where: { status: 'approved' } }] });
  assert.strictEqual(sold, 2, `se vendieron ${sold} unidades con 2 en stock`);
  assert.strictEqual((await db.Product.findByPk(3)).stock, 0);
});

test('por talle: 10 quieren la última M, los de la L no se ven afectados', async () => {
  const { baseUrl, db } = app;
  await db.ProductVariant.bulkCreate([{ product_id: 2, size: 'M', stock: 1 }, { product_id: 2, size: 'L', stock: 3 }]);
  await db.Product.update({ stock: 4 }, { where: { id: 2 } });

  const responses = await Promise.all([
    ...Array.from({ length: 10 }, () => checkout(baseUrl, [{ id: 2, quantity: 1, size: 'M' }])),
    ...Array.from({ length: 3 }, () => checkout(baseUrl, [{ id: 2, quantity: 1, size: 'L' }]))
  ]);
  const okM = responses.slice(0, 10).filter(r => r.status === 303).length;
  const okL = responses.slice(10).filter(r => r.status === 303).length;
  assert.strictEqual(okM, 1, `${okM} compradores se llevaron la última M`);
  assert.strictEqual(okL, 3);
  assert.match(await responses.slice(0, 10).find(r => r.status === 400).text(), /talle M/);

  const variants = await db.ProductVariant.findAll({ where: { product_id: 2 } });
  assert.deepStrictEqual(variants.map(v => v.stock), [0, 0]);
  assert.strictEqual((await db.Product.findByPk(2)).stock, 0);
});

test('talle inexistente o sin elegir: no se crea pedido', async () => {
  const { baseUrl, db } = app;
  const before = await db.Order.count();
  assert.strictEqual((await checkout(baseUrl, [{ id: 2, quantity: 1, size: 'XXL' }])).status, 400);
  assert.strictEqual((await checkout(baseUrl, [{ id: 2, quantity: 1 }])).status, 400);
  assert.strictEqual(await db.Order.count(), before);
});

test('pago cancelado devuelve el stock una sola vez, aunque el aviso llegue repetido', async () => {
  const { baseUrl, db, payments } = app;
  await db.Product.update({ stock: 5 }, { where: { id: 4 } });
  const r = await checkout(baseUrl, [{ id: 4, quantity: 2 }]);
  assert.strictEqual((await db.Product.findByPk(4)).stock, 3, 'la reserva no descontó');

  const paymentId = new URL(r.headers.get('location')).searchParams.get('payment_id');
  payments[paymentId].status = 'cancelled';
  const webhook = () => fetch(baseUrl + '/checkout/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'payment', data: { id: paymentId } }) });
  await Promise.all([webhook(), webhook(), webhook()]);
  assert.strictEqual((await db.Product.findByPk(4)).stock, 5);
});

test('reserva vencida: libera el stock y otro comprador lo puede comprar', async () => {
  const { baseUrl, db } = app;
  await db.Product.update({ stock: 1 }, { where: { id: 5 } });
  await checkout(baseUrl, [{ id: 5, quantity: 1 }]); // va a pagar y nunca vuelve
  assert.strictEqual((await checkout(baseUrl, [{ id: 5, quantity: 1 }])).status, 400);

  await db.Order.update({ expires_at: new Date(Date.now() - 1000) }, { where: { stock_reserved: true, status: 'pending' } });
  const late = await checkout(baseUrl, [{ id: 5, quantity: 1 }]);
  assert.strictEqual(late.status, 303, 'el stock de la reserva vencida no se liberó');
  assert.ok(await db.Order.count({ where: { status: 'expired' } }) >= 1);
});

test('pago aprobado después de vencer y sin stock: queda "en revisión", nunca stock negativo', async () => {
  const { baseUrl, db, payments } = app;
  await db.Product.update({ stock: 1 }, { where: { id: 6 } });
  const first = await checkout(baseUrl, [{ id: 6, quantity: 1 }]);
  const firstPayment = new URL(first.headers.get('location')).searchParams.get('payment_id');

  // Vence la reserva y otro compra la unidad
  await db.Order.update({ expires_at: new Date(Date.now() - 1000) }, { where: { stock_reserved: true, status: 'pending' } });
  const second = await checkout(baseUrl, [{ id: 6, quantity: 1 }]);
  await fetch(second.headers.get('location'));

  // Llega tarde el pago del primero
  payments[firstPayment].status = 'approved';
  await fetch(`${baseUrl}/checkout/success?payment_id=${firstPayment}`);
  const firstOrder = await db.Order.findByPk(Number(firstPayment.replace('PAY-', '')));
  assert.strictEqual(firstOrder.status, 'review');
  assert.strictEqual((await db.Product.findByPk(6)).stock, 0);
});
