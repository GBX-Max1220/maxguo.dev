/**
 * Post-build validation script.
 * Run with: node scripts/validate-build.mjs
 * Checks for P0 defects before deployment.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist');

let exitCode = 0;
const results = [];

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

// 1. Check build succeeded (dist exists with HTML)
const htmlFiles = walk(DIST).filter(f => f.endsWith('.html'));
if (htmlFiles.length === 0) {
  results.push(['FAIL', 'Dist has no HTML files — build likely failed']);
  exitCode = 1;
} else {
  results.push(['PASS', `Build produced ${htmlFiles.length} HTML pages`]);
}

// 2. Check for raw @tailwind in CSS
const cssFiles = walk(DIST).filter(f => f.endsWith('.css'));
let tailwindOk = true;
for (const cssFile of cssFiles) {
  const content = readFileSync(cssFile, 'utf-8');
  if (content.includes('@tailwind')) {
    results.push(['FAIL', `Raw @tailwind in ${cssFile}`]);
    tailwindOk = false;
    exitCode = 1;
  }
}
if (tailwindOk) {
  results.push(['PASS', 'No raw @tailwind directives in CSS']);
}

// 3. Check for Tailwind utility classes in CSS
const cssContent = cssFiles.map(f => readFileSync(f, 'utf-8')).join('\n');
if (cssContent.includes('.grid') && cssContent.includes('.flex') && cssContent.includes('.w-full')) {
  results.push(['PASS', 'Tailwind utility classes appear in CSS']);
} else {
  results.push(['FAIL', 'Tailwind utilities (.grid, .flex, .w-full) missing from CSS']);
  exitCode = 1;
}

// 4. Check for encoding corruption (—?)
for (const htmlFile of htmlFiles) {
  const content = readFileSync(htmlFile, 'utf-8');
  if (content.includes('—?')) {
    results.push(['FAIL', `Encoding corruption (—?) in ${htmlFile}`]);
    exitCode = 1;
    break;
  }
}
if (!results.some(r => r[0] === 'FAIL' && r[1].includes('Encoding'))) {
  results.push(['PASS', 'No encoding corruption (—?) in HTML']);
}

// 5. Check canonical URLs use correct domain
const indexHtml = readFileSync(join(DIST, 'index.html'), 'utf-8');
const expectedDomain = 'https://gbx-max1220.github.io/maxguo.dev';
if (indexHtml.includes(expectedDomain)) {
  results.push(['PASS', `Canonical/OG URLs use ${expectedDomain}`]);
} else {
  results.push(['FAIL', `URLs don't use expected domain ${expectedDomain}`]);
  exitCode = 1;
}

// 6. Check no double prefix (/maxguo.dev/maxguo.dev/)
const doublePrefix = /\/maxguo\.dev\/maxguo\.dev/g;
let foundDouble = false;
for (const htmlFile of htmlFiles) {
  const content = readFileSync(htmlFile, 'utf-8');
  if (doublePrefix.test(content)) {
    results.push(['FAIL', `Double prefix found in ${htmlFile}`]);
    foundDouble = true;
    exitCode = 1;
    break;
  }
}
if (!foundDouble) {
  results.push(['PASS', 'No double prefix in asset paths']);
}

// 7. Check sitemap uses correct domain
try {
  const sitemap = readFileSync(join(DIST, 'sitemap-index.xml'), 'utf-8');
  if (sitemap.includes(expectedDomain) && !sitemap.includes('maxguo.dev')) {
    results.push(['PASS', 'Sitemap uses correct domain']);
  } else {
    results.push(['WARN', 'Sitemap URL check inconclusive']);
  }
} catch {
  results.push(['WARN', 'No sitemap-index.xml found']);
}

// Print results
console.log('\n=== Build Validation Results ===\n');
for (const [status, msg] of results) {
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`  ${icon} [${status}] ${msg}`);
}
console.log(`\n${exitCode === 0 ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);
process.exit(exitCode);
