import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, realpathSync } from 'node:fs';
import { join, extname, resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist');
const BASE = '/maxguo.dev';
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.woff2': 'font/woff2' };

function serveDir(req, res) {
  let p = req.url.split('?')[0];
  if (p === BASE) p += '/';
  if (!p.startsWith(BASE + '/')) { res.writeHead(404); res.end(); return; }
  let sp = p.slice(BASE.length);
  if (sp.endsWith('/')) sp += 'index.html';
  const fp = join(DIST, sp);
  try {
    const rd = realpathSync(DIST), rp = realpathSync(fp);
    const rel = relative(rd, rp);
    if (rel.startsWith('..') || isAbsolute(rel)) { res.writeHead(403); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(fp).toLowerCase()] || 'application/octet-stream' });
    res.end(readFileSync(rp));
  } catch { res.writeHead(404); res.end(); }
}

const server = createServer(serveDir);
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}${BASE}`;

const browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--no-sandbox'] });
let bad = 0;
for (const vp of [[320, 740], [390, 844], [768, 1024], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] } });
  const page = await ctx.newPage();
  for (const route of ['/', '/research/', '/publications/', '/contributions/']) {
    const r = await page.goto(url + route, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log(`${vp[0]}px ${route} status=${r.status()} scrollWidth=${sw} overflow=${over}`);
    if (over) bad++;
  }
  await ctx.close();
}
await browser.close();
server.close();
console.log(bad === 0 ? 'NO OVERFLOW' : `OVERFLOW COUNT ${bad}`);
process.exit(bad === 0 ? 0 : 1);
