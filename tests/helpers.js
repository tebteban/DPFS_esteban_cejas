// Utilidades compartidas por las pruebas: base descartable, Mercado Pago simulado y servidor en proceso.
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');

// Crea una base SQLite nueva con migraciones + seeds. Nunca toca database.sqlite.
function createTestDb() {
  const storage = path.join(os.tmpdir(), `zona6-test-${process.pid}-${Date.now()}.sqlite`);
  const env = { ...process.env, NODE_ENV: 'test', DB_STORAGE: storage };
  execSync('npx sequelize-cli db:migrate', { cwd: root, env, stdio: 'ignore' });
  execSync('npx sequelize-cli db:seed:all', { cwd: root, env, stdio: 'ignore' });
  process.on('exit', () => { try { fs.unlinkSync(storage); } catch {} });
  return storage;
}

// Levanta la app real en este proceso, con Mercado Pago simulado.
// payments: mapa paymentId -> respuesta de Payment.get, que cada prueba completa a gusto.
async function startApp({ port = 4100 + Math.floor(Math.random() * 800) } = {}) {
  const storage = createTestDb();
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DB_STORAGE: storage,
    PORT: String(port),
    APP_BASE_URL: `http://localhost:${port}`,
    MP_ACCESS_TOKEN: 'TEST-fake-token',
    SESSION_SECRET: 'test-secret'
  });

  const mp = require(path.join(root, 'node_modules/mercadopago'));
  const payments = {};
  const preferences = [];
  mp.Preference.prototype.create = async ({ body }) => {
    preferences.push(body);
    // El "checkout" simulado aprueba al toque y vuelve a la página de éxito
    const paymentId = `PAY-${body.external_reference}`;
    payments[paymentId] = payments[paymentId] || {
      status: 'approved',
      external_reference: body.external_reference,
      transaction_amount: body.items.reduce((s, i) => s + i.unit_price * i.quantity, 0),
      payer: { email: 'comprador@test.com' }
    };
    return { id: `PREF-${body.external_reference}`, init_point: `http://localhost:${port}/checkout/success?payment_id=${paymentId}` };
  };
  mp.Payment.prototype.get = async ({ id }) => {
    if (!payments[id]) throw new Error(`Pago ${id} inexistente`);
    return { id, ...payments[id] };
  };

  require(path.join(root, 'app.js'));
  const db = require(path.join(root, 'models'));
  const baseUrl = `http://localhost:${port}`;
  // Esperar a que el servidor responda
  for (let i = 0; i < 50; i++) {
    try { await fetch(baseUrl + '/'); break; } catch { await new Promise(r => setTimeout(r, 100)); }
  }
  return { baseUrl, db, payments, preferences, storage };
}

const shipping = {
  shipping_name: 'Juan Pérez', shipping_phone: '1122334455', shipping_address: 'Calle 123',
  shipping_city: 'Rosario', shipping_province: 'Santa Fe', shipping_zip: '2000'
};

// POST /checkout como lo manda el navegador
const checkout = (baseUrl, cart) => fetch(baseUrl + '/checkout', {
  method: 'POST',
  redirect: 'manual',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ ...shipping, cart: JSON.stringify(cart) })
});

module.exports = { root, createTestDb, startApp, checkout, shipping };
