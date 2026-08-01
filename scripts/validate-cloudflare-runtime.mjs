import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PORT = 8789;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const wranglerArgs = [
  '--yes',
  'wrangler@4.118.0',
  'dev',
  '--local',
  '--port',
  String(PORT),
];
const command = process.platform === 'win32' ? process.env.ComSpec : 'npx';
const commandArgs =
  process.platform === 'win32'
    ? ['/d', '/s', '/c', `npx ${wranglerArgs.join(' ')}`]
    : wranglerArgs;

const child = spawn(
  command,
  commandArgs,
  {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

let logs = '';
child.stdout.on('data', (chunk) => {
  logs += chunk;
});
child.stderr.on('data', (chunk) => {
  logs += chunk;
});

async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Wrangler exited before serving assets.\n${logs}`);
    }

    try {
      const response = await fetch(`${ORIGIN}/`);
      if (response.ok) return response;
    } catch {
      // The local server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Wrangler did not become ready.\n${logs}`);
}

async function assertOk(path, label) {
  const response = await fetch(`${ORIGIN}${path}`);
  if (!response.ok) {
    throw new Error(`${label} returned ${response.status}: ${path}`);
  }
  return response;
}

try {
  const home = await waitForServer();
  const html = await home.text();
  const cssPath = html.match(/href="(\/maxguo\.dev\/_astro\/[^"?]+\.css)"/)?.[1];

  if (!cssPath) {
    throw new Error('Home HTML did not contain a /maxguo.dev-prefixed CSS URL.');
  }

  await assertOk('/maxguo.dev/about/', 'Prefixed static route');
  const css = await assertOk(cssPath, 'Prefixed CSS asset');
  const contentType = css.headers.get('content-type') ?? '';

  if (!contentType.includes('text/css')) {
    throw new Error(`CSS asset returned unexpected content type: ${contentType}`);
  }

  console.log('✅ Cloudflare runtime routing passed');
  console.log(`   / -> ${home.status}`);
  console.log('   /maxguo.dev/about/ -> 200');
  console.log(`   ${cssPath} -> 200 (${contentType})`);
} finally {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
    });
  } else {
    child.kill('SIGTERM');
  }
}
