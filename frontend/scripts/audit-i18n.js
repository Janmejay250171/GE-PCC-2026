import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/i18n/locales');

function loadJSON(filename) {
  const fullPath = path.join(localesDir, filename);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function getDeepKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const nextPrefix = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getDeepKeys(v, nextPrefix));
    } else {
      keys.push(nextPrefix);
    }
  }
  return keys;
}

const en = loadJSON('en.json');
const hi = loadJSON('hi.json');
const kn = loadJSON('kn.json');

const enKeys = new Set(getDeepKeys(en));
const hiKeys = new Set(getDeepKeys(hi));
const knKeys = new Set(getDeepKeys(kn));

console.log('=== SEHATSURE i18n AUDIT ===');
console.log(`Total English keys: ${enKeys.size}`);
console.log(`Total Hindi keys:   ${hiKeys.size}`);
console.log(`Total Kannada keys: ${knKeys.size}`);

const missingInHi = [...enKeys].filter((k) => !hiKeys.has(k));
const missingInKn = [...enKeys].filter((k) => !knKeys.has(k));
const extraInHi = [...hiKeys].filter((k) => !enKeys.has(k));
const extraInKn = [...knKeys].filter((k) => !enKeys.has(k));

let hasErrors = false;

if (missingInHi.length > 0) {
  console.error(`\n❌ Missing in Hindi (${missingInHi.length}):`);
  missingInHi.forEach((k) => console.error(`  - ${k}`));
  hasErrors = true;
} else {
  console.log('✅ Hindi has 100% key parity with English');
}

if (missingInKn.length > 0) {
  console.error(`\n❌ Missing in Kannada (${missingInKn.length}):`);
  missingInKn.forEach((k) => console.error(`  - ${k}`));
  hasErrors = true;
} else {
  console.log('✅ Kannada has 100% key parity with English');
}

if (extraInHi.length > 0) {
  console.warn(`\n⚠️ Extra keys in Hindi (${extraInHi.length}):`, extraInHi);
}
if (extraInKn.length > 0) {
  console.warn(`\n⚠️ Extra keys in Kannada (${extraInKn.length}):`, extraInKn);
}

if (!hasErrors) {
  console.log('\n🎉 ALL 3 LOCALES PASS AUDIT WITH ZERO MISSING KEYS!\n');
  process.exit(0);
} else {
  process.exit(1);
}
