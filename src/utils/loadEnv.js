
const fs = require('fs');
const path = require('path');

let loaded = false;

module.exports = function loadEnv() {
  if (loaded) return;

  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    loaded = true;
    return;
  }

  const fileContent = fs.readFileSync(envPath, 'utf8');
  fileContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const [key, ...rest] = trimmed.split('=');
    if (!key) return;
    const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '');

    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  });

  loaded = true;
};