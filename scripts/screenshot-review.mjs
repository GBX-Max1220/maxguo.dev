import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, realpathSync, mkdirSync } from 'node:fs';
import { join, extname, resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist');
const OUT = resolve(__dirname, '../.astro/review-2026-10-10');
const BASE = '/maxguo.dev';

const MIME_TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

const VIEWPORTS = [
  { width: 390, height: 844, label: 'mobile' },
  { width: 1440, height: 900, label: 'desktop' },
];

const ALL_ROUTES = [
  { route: '/', name: 'home' },
  { route: '/research/', name: 'research' },
  { route: '/publications/', name: 'publications' },
];
// Optional filter: `node scripts/screenshot-review.mjs home`
const only = process.argv[2];
const ROUTES = only ? ALL_ROUTES.filter((r) => r.name === only) : ALL_ROUTES;

function serveDir(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === BASE) urlPath += '/';
  if (!urlPath.startsWith(BASE + '/')) {
    res.writeHead(404); res.end('Not found'); return;
  }
  let sitePath = urlPath.slice(BASE.length);
  if (sitePath.endsWith('/')) sitePath += 'index.html';
  const filePath = join(DIST, sitePath);
  try {
    const realDist = realpathSync(DIST);
    const realPath = realpathSync(filePath);
    const rel = relative(realDist, realPath);
    if (rel.startsWith('..') || isAbsolute(rel)) { res.writeHead(403); res.end('Forbidden'); return; }
    const ext = extname(filePath).toLowerCase();
    const data = readFileSync(realPath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}

const server = createServer(serveDir);
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const BASE_URL = `http://127.0.0.1:${port}`;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--disable-software-rasterizer', '--no-sandbox'] });
const results = [];

try {
  for (const { route, name } of ROUTES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: vp });
      const page = await context.newPage();
      const url = `${BASE_URL}${BASE}${route}`;
      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        if (response.status() !== 200) throw new Error(`HTTP ${response.status()}`);

        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.screenshot({ path: join(OUT, `${name}-${vp.label}-top.png`) });
        await page.screenshot({ path: join(OUT, `${name}-${vp.label}-full.png`), fullPage: true });

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        results.push({ route, vp: vp.label, overflow });
        console.log(`${route} @ ${vp.label}: ${overflow ? 'OVERFLOW' : 'ok'}`);
      } catch (err) {
        results.push({ route, vp: vp.label, error: err.message });
        console.log(`${route} @ ${vp.label}: ERROR ${err.message}`);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

const failures = results.filter(r => r.overflow || r.error);
if (failures.length) {
  console.log('\nFailures:', failures);
  process.exit(1);
}
console.log(`\nScreenshots written to ${OUT}`);
