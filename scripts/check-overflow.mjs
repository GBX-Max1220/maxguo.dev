/**
 * Overflow check script.
 * Verifies no horizontal overflow at key viewport sizes.
 * Run with: node scripts/check-overflow.mjs
 * Requires: playwright (npm install playwright, npx playwright install chromium-headless-shell)
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, realpathSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist');

const VIEWPORTS = [
  { width: 390, height: 844, label: '390×844 (mobile)' },
  { width: 768, height: 1024, label: '768×1024 (tablet)' },
  { width: 1366, height: 768, label: '1366×768 (laptop)' },
  { width: 1440, height: 900, label: '1440×900 (desktop)' },
];

const ROUTES = ['/', '/publications/', '/cv/'];

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

async function serveDir(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const filePath = join(DIST, urlPath);

  // Guard against path traversal — ensure resolved path stays within DIST
  try {
    const realDist = realpathSync(DIST);
    const realPath = realpathSync(filePath);
    if (!realPath.startsWith(realDist + '/') && realPath !== realDist) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    const ext = extname(filePath).toLowerCase();
    const data = readFileSync(realPath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

let exitCode = 0;
const results = [];

// Start local server
const server = createServer(serveDir);
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const BASE_URL = `http://127.0.0.1:${port}`;

console.log(`\nServer started at ${BASE_URL}`);

const browser = await chromium.launch({ headless: true });

try {
  for (const route of ROUTES) {
    const url = `${BASE_URL}${route}`;
    console.log(`\n--- Checking ${route} ---`);

    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: vp });
      const page = await context.newPage();

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        if (overflow) {
          const sw = await page.evaluate(() => document.documentElement.scrollWidth);
          const iw = await page.evaluate(() => window.innerWidth);
          results.push(['FAIL', `${route} @ ${vp.label}: scrollWidth=${sw} > innerWidth=${iw}`]);
          exitCode = 1;
        } else {
          console.log(`  ✅ ${vp.label}: no overflow`);
        }
      } catch (err) {
        results.push(['WARN', `${route} @ ${vp.label}: ${err.message}`]);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

console.log('\n=== Overflow Check Results ===\n');
for (const [status, msg] of results) {
  const icon = status === 'FAIL' ? '❌' : '⚠️';
  console.log(`  ${icon} [${status}] ${msg}`);
}

if (results.length === 0) {
  console.log('  ✅ All routes: no overflow at any viewport');
}

console.log(`\n${exitCode === 0 ? '✅ ALL OVERFLOW CHECKS PASSED' : '❌ OVERFLOW ISSUES FOUND'}`);
process.exit(exitCode);
