import fs from 'node:fs';
import path from 'node:path';

const root = '/private/tmp/sct-site-review';
const htmlFiles = [];
for (const entry of fs.readdirSync(root, { recursive: true })) {
  if (entry.endsWith('.html') && !entry.startsWith('.git/')) htmlFiles.push(entry);
}

const failures = [];
let localLinks = 0;
let images = 0;

for (const file of htmlFiles.sort()) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) failures.push(`${file}: duplicate ids ${[...new Set(duplicates)].join(', ')}`);

  for (const match of source.matchAll(/<img\b[^>]*>/g)) {
    images += 1;
    if (!/\balt="[^"]*"/.test(match[0])) failures.push(`${file}: image without alt: ${match[0]}`);
  }

  for (const match of source.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); }
    catch (error) { failures.push(`${file}: invalid JSON-LD: ${error.message}`); }
  }

  for (const match of source.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|#)/.test(value)) continue;
    localLinks += 1;
    const clean = value.split(/[?#]/)[0];
    let target;
    if (clean.startsWith('/')) target = path.join(root, clean);
    else target = path.resolve(path.dirname(path.join(root, file)), clean);
    if (clean.endsWith('/')) target = path.join(target, 'index.html');
    if (!path.extname(target) && !fs.existsSync(target)) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) failures.push(`${file}: missing local target ${value}`);
  }
}

console.log(`Checked ${htmlFiles.length} HTML files, ${localLinks} local links/assets and ${images} images.`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log('Static site QA passed.');
