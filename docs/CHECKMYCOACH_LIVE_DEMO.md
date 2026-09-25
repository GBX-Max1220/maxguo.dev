# CheckMyCoach live demo

This route is a narrow public, model-backed demonstration of the CheckMyCoach research direction.

## What is live

- `GET /demo/checkmycoach-live/` serves the public interface from the Cloudflare Worker.
- `POST /api/checkmycoach-live` sends one bounded request to DeepSeek.
- The model returns an initial answer, a reliability review, a failure-type label, a delivered answer, and an uncertainty note.
- Latency and token counts shown in the UI come from the actual request/response path; no fake timing is rendered.

## What is not exposed

The public demo does **not** expose the private/local Knowledge Compiler corpus, the full Python `calibrate_full()` runtime, human-validation data, or a claim of validated correction/safety. It is intentionally a public live slice rather than a browser replica of the complete research stack.

## One-time configuration

From the `maxguo.dev` repository, authenticate Wrangler if needed and set the DeepSeek key as a Worker secret:

```bash
npx --yes wrangler@4.118.0 login
npx --yes wrangler@4.118.0 secret put DEEPSEEK_API_KEY
```

Do not commit the key to the repository or place it in a public client-side environment variable.

Optional model override:

```bash
npx --yes wrangler@4.118.0 secret put DEEPSEEK_MODEL
```

If `DEEPSEEK_MODEL` is not set, the Worker uses `deepseek-chat`.

## Validate

```bash
npm run test:worker
npm run validate:cloudflare
```

## Deploy

```bash
npm run deploy:cloudflare
```

Wrangler prints the Worker URL. The shareable demo URL is:

```text
https://<worker-host>/demo/checkmycoach-live/
```

The GitHub Pages deployment remains static; the live endpoint exists only on the Cloudflare Worker deployment because the API key stays server-side.

## Public claim boundary

Safe description:

> A live model-backed demo of a bounded CheckMyCoach review/revision workflow. It generates an answer, checks for a small set of reliability failure types, and revises conservatively when needed.

Do not describe this route as the complete CheckMyCoach research pipeline, a validated safety system, or a live deployment of the local Knowledge Compiler retrieval stack.
