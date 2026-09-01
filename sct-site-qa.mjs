import fs from 'node:fs';
import path from 'node:path';

// Was '/private/tmp/sct-site-review' — a scratch directory that no longer
// exists, so this script had never once run: it threw ENOENT before the
// first check. Point it at the repo it is meant to be checking.
const root = path.dirname(new URL(import.meta.url).pathname);
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

/*
  THE AFFILIATE INVARIANT.

  Amazon's Operating Agreement requires the disclosure wherever Special
  Links appear, and the FTC requires it near them. Right now the site
  complies by accident: exactly one page carries links and exactly that
  page carries a disclosure.

  resources/index.html is the page that makes this urgent — it states "No
  listing below is sponsored." One affiliate link dropped there makes that
  sentence false AND leaves the page undisclosed. This turns the
  coincidence into something that fails a build.
*/
const ASSOCIATES_TAG = 'tag=trailapps-20';
const REQUIRED_DISCLOSURE = 'As an Amazon Associate I earn from qualifying purchases';

let affiliateProblems = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes(ASSOCIATES_TAG)) continue;
  const rel = path.relative(root, file);
  if (!html.includes(REQUIRED_DISCLOSURE)) {
    console.error(`FAIL ${rel}: has affiliate links but not the required disclosure.`);
    affiliateProblems++;
  }
  if (/No listing below is sponsored|nothing here is sponsored/i.test(html)) {
    console.error(`FAIL ${rel}: claims nothing is sponsored while carrying affiliate links.`);
    affiliateProblems++;
  }
  // Cloaking: a Special Link must be a plain amazon.com URL, never a
  // redirect or shortener. This would look like tidy engineering to
  // whoever proposes it, which is exactly why it is checked.
  if (/href="\/go\/|href="https?:\/\/(bit\.ly|tinyurl|t\.co)\//i.test(html)) {
    console.error(`FAIL ${rel}: affiliate link routed through a redirect or shortener.`);
    affiliateProblems++;
  }
}
if (affiliateProblems === 0) console.log('affiliate disclosure: ok');
else process.exitCode = 1;
