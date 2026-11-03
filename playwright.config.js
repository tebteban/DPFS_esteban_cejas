// Pruebas e2e con un Chrome real. Correr con: npm run test:e2e
const { defineConfig, devices } = require('@playwright/test');

const port = 4600;

module.exports = defineConfig({
  testDir: './tests/e2e',
  // Comparten una sola base de prueba, así que van de a una
  workers: 1,
  timeout: 30000,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${port}`,
    channel: 'chrome', // usa el Chrome instalado, sin descargar navegadores
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome' }, testIgnore: /mobile\.spec\.js/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' }, testMatch: /mobile\.spec\.js/ }
  ],
  webServer: {
    command: 'node tests/e2e/server.js',
    url: `http://localhost:${port}`,
    env: { E2E_PORT: String(port) },
    reuseExistingServer: false,
    timeout: 60000
  }
});
