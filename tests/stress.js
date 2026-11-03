// Prueba de estrés: muchos usuarios a la vez navegando y comprando. Correr con: npm run test:stress
// Variables opcionales: USERS (default 50), SECONDS (default 15)
const { startApp, checkout } = require('./helpers');

const USERS = Number(process.env.USERS || 50);
const SECONDS = Number(process.env.SECONDS || 15);

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

// Cada "usuario" hace pedidos uno atrás de otro hasta que se acaba el tiempo
async function load(name, seconds, request) {
  const latencies = [];
  const statuses = {};
  const end = Date.now() + seconds * 1000;
  await Promise.all(Array.from({ length: USERS }, async () => {
    while (Date.now() < end) {
      const start = performance.now();
      let status;
      try {
        const res = await request();
        await res.arrayBuffer();
        status = res.status;
      } catch (error) {
        status = 'conexión fallida';
      }
      latencies.push(performance.now() - start);
      statuses[status] = (statuses[status] || 0) + 1;
    }
  }));
  latencies.sort((a, b) => a - b);
  const ms = (v) => `${Math.round(v)} ms`;
  console.log(`\n${name} — ${USERS} usuarios durante ${seconds}s`);
  console.log(`  pedidos: ${latencies.length} (${Math.round(latencies.length / seconds)} por segundo)`);
  console.log(`  tiempo de respuesta: mediana ${ms(percentile(latencies, 0.5))}, 95% ${ms(percentile(latencies, 0.95))}, 99% ${ms(percentile(latencies, 0.99))}, peor ${ms(latencies.at(-1))}`);
  console.log(`  respuestas: ${Object.entries(statuses).map(([s, n]) => `${s} × ${n}`).join(', ')}`);
  return { statuses, count: latencies.length };
}

(async () => {
  const { baseUrl, db } = await startApp();
  const pages = ['/', '/productos', '/productos?categoria=1&orden=precio_asc', '/productos/1', '/productos/buscar-producto?q=z6', '/cart', '/api/products', '/arrepentimiento'];
  let i = 0;
  const failures = [];

  const browsing = await load('Navegación', SECONDS, () => fetch(baseUrl + pages[i++ % pages.length]));
  const browsingErrors = Object.entries(browsing.statuses).filter(([s]) => s !== '200').reduce((n, [, c]) => n + c, 0);
  if (browsingErrors) failures.push(`${browsingErrors} respuestas con error navegando`);

  const INITIAL = 1000000;
  await db.Product.update({ stock: INITIAL }, { where: { id: 4 } });
  const buying = await load('Compras', Math.ceil(SECONDS * 2 / 3), () => checkout(baseUrl, [{ id: 4, quantity: 1 }]));
  if (Object.keys(buying.statuses).some(s => s !== '303')) failures.push(`compras con respuestas inesperadas: ${JSON.stringify(buying.statuses)}`);

  // Cada compra que llegó a Mercado Pago tiene que haber apartado exactamente una unidad
  const reserved = await db.OrderItem.sum('quantity', { where: { product_id: 4 } });
  const stock = (await db.Product.findByPk(4)).stock;
  console.log(`\nConsistencia: ${reserved} unidades reservadas, stock ${INITIAL} → ${stock}`);
  if (INITIAL - stock !== reserved || reserved !== buying.statuses['303']) failures.push('el stock no cierra con los pedidos creados');

  console.log(failures.length ? `\n✖ FALLÓ:\n  - ${failures.join('\n  - ')}` : '\n✔ Sin errores y con el stock consistente');
  process.exit(failures.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
