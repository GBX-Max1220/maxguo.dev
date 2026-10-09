/**
 * Serves dist under the real deployment base (/maxguo.dev) and asserts that
 * every asset the homepage depends on returns HTTP 200.
 *
 * Run with: node scripts/check-deployed-assets.mjs
 */
import { createServer } from 'node:http';
import { readFileSync, realpathSync } from 'node:fs';
import { join, extname, resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist');
const BASE = '/maxguo.dev';
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.xml': 'application/xml', '.json': 'application/json', '.woff2': 'font/woff2',
  '.pdf': 'application/pdf', '.txt': 'text/plain',
};

function serveDir(req, res) {
  let p = req.url.split('?')[0];
  if (p === BASE) p += '/';
  if (!p.startsWith(BASE + '/')) { res.writeHead(404); res.end('Not found'); return; }
  let sp = p.slice(BASE.length);
  if (sp.endsWith('/')) sp += 'index.html';
  const fp = join(DIST, sp);
  try {
    const rd = realpathSync(DIST), rp = realpathSync(fp);
    const rel = relative(rd, rp);
    if (rel.startsWith('..') || isAbsolute(rel)) { res.writeHead(403); res.end('Forbidden'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(fp).toLowerCase()] || 'application/octet-stream' });
    res.end(readFileSync(rp));
  } catch { res.writeHead(404); res.end('Not found'); }
}

const server = createServer(serveDir);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

// Assets are read out of the built homepage rather than hardcoded, so the
// check fails if the page stops shipping them.
const indexHtml = readFileSync(join(DIST, 'index.html'), 'utf-8');
const assets = [...indexHtml.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((v) => v.startsWith(`${BASE}/images/`) || v.startsWith(`${BASE}/_astro/`));

const routes = ['/', '/research/', '/publications/', '/contributions/', '/cv/'];
const targets = [...new Set([...assets, ...routes.map((r) => `${BASE}${r}`)])];

let bad = 0;
for (const target of targets) {
  const res = await fetch(origin + target);
  await res.arrayBuffer();
  if (res.status !== 200) { console.log(`  ❌ ${res.status} ${target}`); bad++; }
}
console.log(`checked ${targets.length} URLs under ${BASE}`);
server.close();
if (bad > 0) { console.log(`\n❌ ${bad} asset(s) did not resolve under the deployment base`); process.exit(1); }
console.log('✅ all homepage assets and entry routes return 200 under /maxguo.dev');
