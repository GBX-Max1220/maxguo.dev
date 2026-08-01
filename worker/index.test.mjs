import assert from 'node:assert/strict';
import test from 'node:test';

import worker from './index.js';

function createEnv() {
  const requests = [];
  return {
    requests,
    env: {
      ASSETS: {
        async fetch(request) {
          requests.push(request);
          return new Response('ok');
        },
      },
    },
  };
}

test('passes root requests through unchanged', async () => {
  const { env, requests } = createEnv();
  await worker.fetch(new Request('https://preview.example/about/'), env);

  assert.equal(requests.length, 1);
  assert.equal(new URL(requests[0].url).pathname, '/about/');
});

test('maps the GitHub Pages base to the Worker root', async () => {
  const { env, requests } = createEnv();
  await worker.fetch(new Request('https://preview.example/maxguo.dev'), env);

  assert.equal(new URL(requests[0].url).pathname, '/');
});

test('strips the GitHub Pages base from nested asset requests', async () => {
  const { env, requests } = createEnv();
  await worker.fetch(
    new Request('https://preview.example/maxguo.dev/_astro/site.css?version=1'),
    env,
  );

  const forwarded = new URL(requests[0].url);
  assert.equal(forwarded.pathname, '/_astro/site.css');
  assert.equal(forwarded.search, '?version=1');
});
