// Recorridos completos como los haría una persona, en un Chrome real.
const { test, expect } = require('@playwright/test');
const { ADMIN } = require('./server');

const loginAdmin = async (page) => {
  await page.goto('/admin/login');
  await page.getByLabel('Usuario o email').fill(ADMIN.email);
  await page.getByLabel('Contraseña').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin$/);
};

test('compra completa: talle, carrito, envío, pago y pedido en el panel', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Ver colección' }).first().click();
  await expect(page).toHaveURL(/\/productos/);

  // La remera tiene talles: desde el catálogo hay que ir a elegir
  const card = page.locator('article').filter({ hasText: 'Remera Z6 Match Oficial' });
  await card.getByRole('link', { name: 'Elegir talle' }).click();

  // M está agotado, no se puede elegir
  await expect(page.getByRole('radio', { name: 'M' })).toBeDisabled();

  // Sin talle no deja agregar
  await page.getByRole('button', { name: 'Agregar al bolso' }).click();
  await expect(page.getByText('Elegí un talle para continuar.')).toBeVisible();

  // Galería: la segunda foto cambia la principal
  await page.getByRole('button', { name: 'Ver foto 2' }).click();
  await expect(page.locator('#mainImage')).toHaveAttribute('src', '/img/products/manga.jpg');

  await page.getByText('L', { exact: true }).click();
  await page.getByRole('button', { name: 'Agregar al bolso' }).click();
  await expect(page.locator('#cartItemCount')).toHaveText('1');

  // Panel lateral -> carrito
  await page.getByRole('button', { name: 'Abrir carrito' }).click();
  await expect(page.getByRole('dialog').getByText('Talle L')).toBeVisible();
  await page.getByRole('link', { name: 'Finalizar compra' }).click();
  await expect(page).toHaveURL(/\/cart$/);

  // Datos de envío
  await page.getByLabel('Nombre y apellido').fill('Ana Gómez');
  await page.getByLabel('Teléfono').fill('3415551234');
  await page.getByLabel('Dirección').fill('San Martín 1234');
  await page.getByLabel('Ciudad').fill('Rosario');
  await page.getByLabel('Provincia').selectOption('Santa Fe');
  await page.getByLabel('Código postal').fill('2000');
  await page.getByRole('button', { name: 'Pagar con Mercado Pago' }).click();

  // Mercado Pago simulado aprueba y vuelve
  await expect(page.getByRole('heading', { name: '¡Gracias por tu compra!' })).toBeVisible();
  await expect(page.getByText('Pagado')).toBeVisible();
  await expect(page.getByText('1× Remera Z6 Match Oficial · Talle L')).toBeVisible();
  await expect(page.locator('#cartItemCount')).toBeHidden();

  // El admin ve el pedido y el stock del talle L bajó de 5 a 4
  await loginAdmin(page);
  const row = page.locator('tr').filter({ hasText: 'Ana Gómez' });
  await expect(row).toContainText('Pagado');
  await expect(row).toContainText('Rosario, Santa Fe');
  await expect(page.locator('tr').filter({ hasText: 'Remera Z6 Match Oficial' }).last()).toContainText('L: 4');
});

test('el admin carga un producto con cantidad por talle', async ({ page }) => {
  await loginAdmin(page);
  await page.getByRole('link', { name: 'Nuevo producto' }).click();

  await page.getByLabel('Nombre del producto').fill('Short Z6 Slide E2E');
  await page.getByLabel('Descripción').fill('Short de juego para pruebas de punta a punta.');
  await page.getByLabel('Precio ($)').fill('19990');
  await page.getByLabel('Categoría').selectOption({ label: 'Indumentaria' });
  await page.getByLabel('Marca').selectOption({ label: 'Zona 6' });
  await page.getByLabel('Imagen', { exact: true }).setInputFiles('public/img/products/calza.png');

  await page.getByRole('button', { name: 'Cargar S a XXL' }).click();
  const quantities = page.getByLabel('Cantidad');
  await expect(quantities).toHaveCount(5);
  for (const [i, n] of [3, 0, 4, 2, 1].entries()) await quantities.nth(i).fill(String(n));
  await expect(page.getByText('Total: 10 unidades')).toBeVisible();
  // Con talles, el campo de stock único se oculta
  await expect(page.locator('#singleStock')).toBeHidden();

  await page.getByRole('button', { name: 'Cargar producto' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const row = page.locator('tr').filter({ hasText: 'Short Z6 Slide E2E' });
  await expect(row).toContainText('10 disp.');
  await expect(row).toContainText('S: 3 · M: 0 · L: 4 · XL: 2 · XXL: 1');

  // En la tienda, el talle M aparece agotado
  await row.getByRole('link', { name: 'Short Z6 Slide E2E' }).click();
  await expect(page.getByRole('radio', { name: 'M' })).toBeDisabled();
  await expect(page.getByRole('radio', { name: 'XXL' })).toBeEnabled();

  // Borrar el producto: así su foto no queda en public/img/products
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Eliminar' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.locator('tr').filter({ hasText: 'Short Z6 Slide E2E' })).toHaveCount(0);
});

test('el admin no puede guardar talles repetidos', async ({ page }) => {
  await loginAdmin(page);
  await page.goto('/productos/createProduct');
  await page.getByLabel('Nombre del producto').fill('Producto con error');
  await page.getByLabel('Descripción').fill('Descripción suficientemente larga.');
  await page.getByLabel('Precio ($)').fill('100');
  await page.getByLabel('Categoría').selectOption({ label: 'Indumentaria' });
  await page.getByLabel('Marca').selectOption({ label: 'Zona 6' });
  await page.getByLabel('Imagen', { exact: true }).setInputFiles('public/img/products/red.jpg');
  for (const size of ['M', 'm']) {
    await page.getByRole('button', { name: 'Agregar talle' }).click();
    await page.getByLabel('Talle', { exact: true }).last().fill(size);
    await page.getByLabel('Cantidad').last().fill('1');
  }
  await page.getByRole('button', { name: 'Cargar producto' }).click();
  await expect(page.getByText('Hay talles repetidos.')).toBeVisible();
  // Las filas se conservan para corregir
  await expect(page.getByLabel('Talle', { exact: true })).toHaveCount(2);
});

test('registro, login y edición de perfil', async ({ page }) => {
  const email = `cliente${Date.now()}@test.com`;
  await page.goto('/users/register');
  await page.getByLabel('Nombre').fill('Lucía');
  await page.getByLabel('Apellido').fill('Fernández');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill('Clave1234');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByText('¡Registro exitoso!')).toBeVisible();

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill('Clave1234');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Lucía' })).toBeVisible();
  await expect(page.getByText('Todavía no hiciste ninguna compra.')).toBeVisible();

  await page.getByRole('link', { name: 'Editar perfil' }).click();
  await page.getByLabel('Nombre', { exact: true }).fill('Lu');
  await page.getByLabel('Contraseña actual').fill('incorrecta');
  await page.getByLabel('Contraseña nueva').fill('Nueva1234');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('La contraseña actual no es correcta.')).toBeVisible();

  await page.getByLabel('Contraseña actual').fill('Clave1234');
  await page.getByLabel('Contraseña nueva').fill('Nueva1234');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Lu' })).toBeVisible();
});

test('botón de arrepentimiento desde el footer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Botón de arrepentimiento' }).click();
  await page.getByLabel('Nombre y apellido').fill('Pedro Ruiz');
  await page.getByLabel('Email').fill('no-es-un-email');
  await page.getByRole('button', { name: 'Solicitar la cancelación' }).click();
  // El navegador frena el email inválido antes de enviar
  await expect(page).toHaveURL(/\/arrepentimiento$/);
  await page.getByLabel('Email').fill('pedro@test.com');
  await page.getByRole('button', { name: 'Solicitar la cancelación' }).click();
  await expect(page.getByRole('heading', { name: 'Recibimos tu solicitud' })).toBeVisible();
  await expect(page.getByText(/^ARR-[0-9A-F]{8}$/)).toBeVisible();
});

test('un cliente no puede entrar al panel ni a cargar productos', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto('/productos/createProduct');
  await expect(page).toHaveURL(/\/admin\/login$/);
});
