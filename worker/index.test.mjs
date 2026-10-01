import assert from 'node:assert/strict';
import test from 'node:test';

import worker from './index.js';

function createEnv(overrides = {}) {
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
      ...overrides,
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

  assert.equal(requests.length, 1);
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

test('serves the live CheckMyCoach page without touching static assets', async () => {
  const { env, requests } = createEnv();
  const response = await worker.fetch(
    new Request('https://preview.example/demo/checkmycoach-live/'),
    env,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(await response.text(), /CheckMyCoach/);
  assert.equal(requests.length, 0);
});

test('rejects live API requests when the secret is missing', async () => {
  const { env } = createEnv();
  const response = await worker.fetch(
    new Request('https://preview.example/api/checkmycoach-live', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'How should a beginner think about squat depth?' }),
    }),
    env,
  );

  assert.equal(response.status, 503);
  const data = await response.json();
  assert.equal(data.code, 'DEMO_NOT_CONFIGURED');
});

test('runs a structured live response through the injected upstream fetch', async () => {
  const upstreamCalls = [];
  const { env } = createEnv({
    DEEPSEEK_API_KEY: 'test-key',
    UPSTREAM_FETCH: async (url, options) => {
      upstreamCalls.push({ url, options });
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  initial_answer: 'Start with a comfortable depth you can control.',
                  review: {
                    decision: 'revise',
                    failure_type: 'MISSING_CONTEXT',
                    reason: 'The answer should make individual mobility and symptoms explicit.',
                  },
                  final_answer: 'Use a depth you can control without pain, and adjust for mobility and experience.',
                  uncertainty_note: 'Injury history and current symptoms would change the recommendation.',
                }),
              },
            },
          ],
          usage: { prompt_tokens: 100, completion_tokens: 80 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    },
  });

  const response = await worker.fetch(
    new Request('https://preview.example/api/checkmycoach-live', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'How should a beginner think about squat depth?' }),
    }),
    env,
  );

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.review.failure_type, 'MISSING_CONTEXT');
  assert.equal(data.model, 'deepseek-chat');
  assert.equal(data.usage.prompt_tokens, 100);
  assert.equal(upstreamCalls.length, 1);
  assert.equal(upstreamCalls[0].url, 'https://api.deepseek.com/chat/completions');
});
