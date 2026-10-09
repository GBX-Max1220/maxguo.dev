/**
 * Post-build base-path verification.
 *
 * Guards the deployment base (/maxguo.dev) so a silently unprefixed asset
 * cannot ship: it would render as a broken image or an unstyled page in
 * production while every local check still passes.
 *
 * Fails with a non-zero exit code when:
 *   - any dist HTML contains a doubled /maxguo.dev/maxguo.dev/ prefix
 *   - the homepage does not reference the expected images under the base
 *   - a referenced image or stylesheet is absent from dist (would 404)
 *   - a homepage internal route is left unprefixed
 *   - any page still carries a root-relative /images/ /_astro/ /og/ reference
 *
 * Run with: node scripts/verify-base-paths.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist');
const BASE = '/maxguo.dev';

const failures = [];
const fail = (message) => failures.push(message);

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
if (htmlFiles.length === 0) fail('dist has no HTML files — build did not produce output');

// 1. Doubled prefix anywhere in the built site.
for (const file of htmlFiles) {
  if (readFileSync(file, 'utf-8').includes(`${BASE}${BASE}/`)) {
    fail(`${file.replace(DIST, '')}: doubled base prefix ${BASE}${BASE}/`);
    break;
  }
}

// 2. Homepage figures and hero must be referenced under the base and exist.
const indexPath = join(DIST, 'index.html');
if (!existsSync(indexPath)) {
  fail('dist/index.html missing');
} else {
  const indexHtml = readFileSync(indexPath, 'utf-8');
  const expectedImages = [
    '/images/home-hero.png',
    '/images/research/boundary-failure-attribution.svg',
    '/images/research/pmd-identity-controls.svg',
    '/images/research/authority-cross-consumer.svg',
  ];
  for (const image of expectedImages) {
    if (!indexHtml.includes(`"${BASE}${image}"`)) {
      fail(`homepage does not reference ${BASE}${image}`);
    }
    if (!existsSync(join(DIST, image.slice(1)))) {
      fail(`asset absent from dist (would 404): ${image}`);
    }
  }

  // 3. Stylesheets must be prefixed and resolvable.
  const cssHrefs = [...indexHtml.matchAll(/href="([^"]*\.css)"/g)].map((m) => m[1]);
  if (cssHrefs.length === 0) fail('homepage links no stylesheet');
  for (const href of cssHrefs) {
    if (!href.startsWith(`${BASE}/`)) fail(`stylesheet href missing base prefix: ${href}`);
    else if (!existsSync(join(DIST, href.slice(BASE.length + 1)))) fail(`stylesheet absent from dist: ${href}`);
  }

  // 4. Internal entry points must be prefixed so they resolve under the base.
  for (const route of ['/research/', '/contributions/', '/publications/', '/cv/']) {
    if (!indexHtml.includes(`href="${BASE}${route}"`)) {
      fail(`homepage internal link missing base prefix: ${route}`);
    }
  }
}

// 5. No root-relative asset reference may survive in any built page.
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf-8');
  for (const match of html.matchAll(/(?:src|href)="(\/[^"]*)"/g)) {
    const value = match[1];
    if (/^\/(images|_astro|og)\//.test(value)) {
      fail(`${file.replace(DIST, '')}: unprefixed root-relative asset ${value}`);
    }
  }
}

if (failures.length > 0) {
  console.log('\n=== Base path verification FAILED ===');
  for (const message of failures) console.log(`  ❌ ${message}`);
  process.exit(1);
}

console.log(`[verify-base-paths] OK — ${htmlFiles.length} pages: assets, stylesheets and internal routes carry ${BASE}; no doubled prefix; no missing files`);
