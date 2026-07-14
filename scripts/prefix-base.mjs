/**
 * Post-build script: add BASE prefix to all root-relative paths in HTML.
 * Astro with `base` config auto-prefixes built assets (CSS/JS in _astro/)
 * but NOT manually written href/src attributes in templates.
 *
 * Usage: node scripts/prefix-base.mjs
 * Runs automatically after `npm run build`.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = '/maxguo.dev';
const DIST = resolve(__dirname, '../dist').replace(/\\/g, '/');

/** Skip these URL schemes / patterns — they should stay as-is */
const SKIP_PATTERN = /^(https?:|mailto:|tel:|#|\/\/)/;
/** Already has the base prefix */
const ALREADY_PREFIXED = new RegExp(`^${BASE}/`);

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (extname(full) === '.html') {
      files.push(full);
    }
  }
  return files;
}

function prefixAttribute(html, attr) {
  // Replace attr="/..." but NOT already-prefixed or external URLs
  const regex = new RegExp(`(${attr}=")(/[^"]+)"`, 'g');
  return html.replace(regex, (match, prefix, path) => {
    // Skip external / protocol-relative / anchor-only paths
    if (SKIP_PATTERN.test(path)) return match;
    // Skip already-prefixed paths
    if (ALREADY_PREFIXED.test(path)) return match;
    // Skip paths that are not root-relative
    if (!path.startsWith('/')) return match;
    return `${prefix}${BASE}${path}"`;
  });
}

function prefixSrcset(html) {
  // Handle srcset="..." — each comma-separated URL
  return html.replace(/srcset="([^"]+)"/g, (match, value) => {
    const prefixed = value.split(',').map(part => {
      const trimmed = part.trim();
      const [url, ...rest] = trimmed.split(/\s+/);
      if (url.startsWith('/') && !SKIP_PATTERN.test(url) && !ALREADY_PREFIXED.test(url)) {
        return `${BASE}${url} ${rest.join(' ')}`.trim();
      }
      return part;
    }).join(',');
    return `srcset="${prefixed}"`;
  });
}

const files = walk(DIST);
let count = 0;

for (const file of files) {
  let html = readFileSync(file, 'utf-8');
  const before = html;

  // Prefix href, src, and other URL attributes
  html = prefixAttribute(html, 'href');
  html = prefixAttribute(html, 'src');
  html = prefixAttribute(html, 'action');
  html = prefixSrcset(html);

  if (html !== before) {
    writeFileSync(file, html, 'utf-8');
    count++;
  }
}

console.log(`[prefix-base] Prefixed ${count} HTML files with BASE="${BASE}"`);
