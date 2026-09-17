/**
 * Overflow check script.
 * Verifies no horizontal overflow at key viewport sizes, served from the
 * real built pages in dist/ (never an error fallback).
 * Run with: node scripts/check-overflow.mjs
 * Requires: playwright (npm install playwright, npx playwright install chromium-headless-shell)
 */
import { chromium } from 'playwright';
import { createServer, request as httpRequest } from 'node:http';
import { readFileSync, realpathSync } from 'node:fs';
import { join, extname, resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist');

// The built site is deployed under this base (GitHub Pages project site).
// Root-relative asset and href URLs inside dist HTML carry this prefix, so
// the local server must mount DIST at the same base to reproduce production.
const BASE = '/maxguo.dev';

const VIEWPORTS = [
  { width: 375, height: 812, label: '375×812 (mobile)' },
  { width: 390, height: 844, label: '390×844 (mobile)' },
  { width: 768, height: 1024, label: '768×1024 (tablet)' },
  { width: 1366, height: 768, label: '1366×768 (laptop)' },
  { width: 1440, height: 900, label: '1440×900 (desktop)' },
];

const ROUTES = ['/', '/demo/', '/demo/interactionkit/', '/demo/checkmycoach/', '/demo/eval-runtime/', '/research/', '/projects/', '/publications/', '/cv/'];

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
  if (urlPath === BASE) urlPath += '/';

  // Only paths under BASE map onto the built site, mirroring production
  // where site content lives at <origin>/maxguo.dev/.
  if (!urlPath.startsWith(BASE + '/')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let sitePath = urlPath.slice(BASE.length);
  if (sitePath.endsWith('/')) sitePath += 'index.html';
  const filePath = join(DIST, sitePath);

  // Guard against path traversal: containment is asserted on the resolved
  // real paths. path.relative() is platform-correct, so the '..' escape test
  // works with native separators on both Windows and POSIX.
  try {
    const realDist = realpathSync(DIST);
    const realPath = realpathSync(filePath);
    const rel = relative(realDist, realPath);
    if (rel.startsWith('..') || isAbsolute(rel)) {
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

console.log(`\nServer started at ${BASE_URL} (mounting dist at ${BASE})`);

function rawRequestStatus(path) {
  return new Promise((resolveStatus, reject) => {
    const req = httpRequest({ host: '127.0.0.1', port, path, method: 'GET' }, (res) => {
      res.resume();
      res.on('end', () => resolveStatus(res.statusCode));
    });
    req.on('error', reject);
    req.end();
  });
}

// Self-check before browsing: the built index must resolve under BASE, the
// bare host root must not serve site content, and a raw traversal probe must
// be denied by the containment guard (http.request sends the path
// unnormalized, so this exercises the guard itself rather than URL parsing).
{
  const builtIndex = await rawRequestStatus(`${BASE}/`);
  const bareRoot = await rawRequestStatus('/');
  const traversal = await rawRequestStatus(`${BASE}/../package.json`);
  if (builtIndex !== 200) {
    console.error(`\n❌ Self-check failed: ${BASE}/ returned ${builtIndex}. Run "npm run build" first.`);
    server.close();
    process.exit(1);
  }
  if (bareRoot === 200) {
    console.error(`\n❌ Self-check failed: bare "/" unexpectedly serves site content (BASE mount broken).`);
    server.close();
    process.exit(1);
  }
  if (traversal !== 403 && traversal !== 404) {
    console.error(`\n❌ Self-check failed: traversal probe "${BASE}/../package.json" returned ${traversal} (expected 403/404).`);
    server.close();
    process.exit(1);
  }
  console.log(`Self-check OK: ${BASE}/ -> ${builtIndex}, bare "/" -> ${bareRoot}, traversal probe -> ${traversal}`);
}

const browser = await chromium.launch({ headless: true });

try {
  for (const route of ROUTES) {
    const url = `${BASE_URL}${BASE}${route}`;
    console.log(`\n--- Checking ${BASE}${route} ---`);

    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: vp });
      const page = await context.newPage();

      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
        const status = response ? response.status() : 0;

        // Identity proof: the runner must measure the built page itself,
        // never a 404/error fallback.
        if (status !== 200) {
          results.push(['FAIL', `${BASE}${route} @ ${vp.label}: expected HTTP 200 for the built page, got ${status}`]);
          exitCode = 1;
          continue;
        }

        if (vp === VIEWPORTS[0]) {
          const title = await page.title();
          if (!title || /not found/i.test(title)) {
            results.push(['FAIL', `${BASE}${route}: page identity check failed (title="${title}")`]);
            exitCode = 1;
            continue;
          }
          console.log(`  served: HTTP 200 · title="${title}"`);
        }

        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        if (overflow) {
          const sw = await page.evaluate(() => document.documentElement.scrollWidth);
          const iw = await page.evaluate(() => window.innerWidth);
          results.push(['FAIL', `${BASE}${route} @ ${vp.label}: scrollWidth=${sw} > innerWidth=${iw}`]);
          exitCode = 1;
        } else {
          console.log(`  ✅ ${vp.label}: no overflow`);
        }
      } catch (err) {
        results.push(['WARN', `${BASE}${route} @ ${vp.label}: ${err.message}`]);
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
