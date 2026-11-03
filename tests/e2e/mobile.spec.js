// La tienda en un celular (Pixel 7): menú, carrito y que nada se salga de la pantalla.
const { test, expect } = require('@playwright/test');

for (const path of ['/', '/productos', '/productos/1', '/cart', '/users/login', '/users/register', '/arrepentimiento']) {
  test(`${path} no se desborda a lo ancho`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('menú hamburguesa y carrito lateral', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await expect(page.locator('#mobileMenu').getByRole('link', { name: 'Catálogo' })).toBeVisible();
  await page.locator('#mobileMenu').getByRole('link', { name: 'Catálogo' }).click();
  await expect(page).toHaveURL(/\/productos$/);

  await page.locator('article').filter({ hasText: 'Calzas Z6 Slide' }).getByRole('button', { name: 'Agregar' }).click();
  await page.getByRole('button', { name: 'Abrir carrito' }).click();
  await expect(page.getByRole('dialog').getByText('Calzas Z6 Slide')).toBeVisible();
});

test('el slider de portada se desliza con el dedo', async ({ page }) => {
  await page.goto('/');
  const slider = page.locator('#heroSlider');
  const box = await slider.boundingBox();
  const y = box.y + box.height / 2;
  await page.touchscreen.tap(box.x + 10, y); // asegura foco táctil
  await slider.dispatchEvent('touchstart', { touches: [{ identifier: 1, clientX: box.x + box.width - 20, clientY: y }] });
  await slider.dispatchEvent('touchend', { changedTouches: [{ identifier: 1, clientX: box.x + 20, clientY: y }] });
  await expect(page.locator('.hero-dot').nth(1)).toHaveClass(/is-active/);
});
