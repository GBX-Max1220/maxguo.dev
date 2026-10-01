const GITHUB_PAGES_BASE = '/maxguo.dev';
const LIVE_DEMO_PATH = '/demo/checkmycoach-live';
const LIVE_API_PATH = '/api/checkmycoach-live';
const DEFAULT_MODEL = 'deepseek-chat';
const MAX_QUESTION_CHARS = 600;

const FAILURE_TYPES = new Set([
  'NONE',
  'OVERPRECISION',
  'MISSING_CONTEXT',
  'UNSUPPORTED_CAUSAL',
  'OTHER',
]);

function jsonResponse(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function liveDemoHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="description" content="Live model-backed CheckMyCoach demo: generate, review, and revise a fitness-information answer with explicit failure attribution." />
  <title>CheckMyCoach — Live model demo</title>
  <style>
    :root{color-scheme:light;--ink:#172033;--muted:#667085;--line:#dfe4ec;--paper:#f7f8fa;--card:#fff;--accent:#2457d6;--soft:#eef3ff;--ok:#116b43;--warn:#8a4b08;--danger:#9d1c2f}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.5}
    main{max-width:980px;margin:0 auto;padding:48px 20px 80px}header{margin-bottom:28px}.eyebrow{font:700 12px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}h1{font-size:clamp(2rem,5vw,3.6rem);line-height:1.02;margin:8px 0 12px;letter-spacing:-.04em}h2{font-size:1.05rem;margin:0 0 10px}.lead{max-width:760px;color:#465269;font-size:1.05rem}.grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px}.meta{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.pill{font:700 11px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.04em;padding:5px 8px;border-radius:999px;background:var(--soft);color:var(--accent);border:1px solid #cbd9ff}.pill.neutral{background:#f5f6f8;color:#596174;border-color:var(--line)}textarea{width:100%;min-height:120px;resize:vertical;border:1px solid #cdd4df;border-radius:12px;padding:13px 14px;font:inherit;color:var(--ink);background:#fff}textarea:focus{outline:3px solid #dbe5ff;border-color:#8cacf6}button{appearance:none;border:0;border-radius:10px;background:var(--accent);color:#fff;padding:11px 15px;font:700 14px inherit;cursor:pointer}button[disabled]{cursor:not-allowed;opacity:.55}.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px}.hint{font-size:12px;color:var(--muted)}.status{font:700 12px ui-monospace,SFMono-Regular,Menlo,monospace}.status.ok{color:var(--ok)}.status.warn{color:var(--warn)}.status.error{color:var(--danger)}.result{white-space:pre-wrap;font-size:14px;color:#303b50}.kv{display:grid;grid-template-columns:150px 1fr;gap:10px;padding:8px 0;border-top:1px solid #eef0f4}.kv:first-child{border-top:0}.k{font:700 11px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;color:var(--muted)}.v{font-size:14px}.notice{border-left:4px solid var(--accent);background:#f2f6ff;padding:13px 14px;border-radius:10px;color:#43506a;font-size:13px}.footer{margin-top:22px;color:var(--muted);font-size:12px}.hidden{display:none!important}@media(min-width:860px){.grid.results{grid-template-columns:1fr 1fr}.span2{grid-column:1 / -1}}
  </style>
</head>
<body>
<main>
  <header>
    <div class="eyebrow">Live research artifact · model-backed</div>
    <h1>CheckMyCoach</h1>
    <p class="lead">A bounded live demo of one public slice of the CheckMyCoach pipeline: generate an answer, inspect it for common reliability failures, and produce a more cautious revision when needed.</p>
    <div class="meta"><span class="pill">Live DeepSeek call</span><span class="pill neutral">No fake latency</span><span class="pill neutral">No private research data</span></div>
  </header>

  <div class="notice">
    This public demo exposes only the model-backed review/revision slice. The research prototype's retrieval and human-validation infrastructure are not exposed here. This is not medical advice and does not establish that a revision is correct or safe.
  </div>

  <section class="card" style="margin-top:16px">
    <h2>Ask a general fitness-information question</h2>
    <textarea id="question" maxlength="600" placeholder="Example: How should a beginner think about squat depth?">How should a beginner think about squat depth?</textarea>
    <div class="row">
      <button id="run">Run live</button>
      <span id="status" class="status">Ready</span>
      <span class="hint">Maximum 600 characters. One live inference request per click.</span>
    </div>
  </section>

  <section id="results" class="grid results hidden" style="margin-top:16px">
    <article class="card span2">
      <h2>Initial answer</h2>
      <div id="initial" class="result"></div>
    </article>
    <article class="card">
      <h2>Reliability review</h2>
      <div class="kv"><div class="k">Decision</div><div id="decision" class="v"></div></div>
      <div class="kv"><div class="k">Failure type</div><div id="failure" class="v"></div></div>
      <div class="kv"><div class="k">Reason</div><div id="reason" class="v"></div></div>
      <div class="kv"><div class="k">Uncertainty</div><div id="uncertainty" class="v"></div></div>
    </article>
    <article class="card">
      <h2>Run metadata</h2>
      <div class="kv"><div class="k">Model</div><div id="model" class="v"></div></div>
      <div class="kv"><div class="k">Latency</div><div id="latency" class="v"></div></div>
      <div class="kv"><div class="k">Tokens</div><div id="tokens" class="v"></div></div>
      <div class="kv"><div class="k">Mode</div><div class="v">single structured model call</div></div>
    </article>
    <article class="card span2">
      <h2>Delivered answer</h2>
      <div id="final" class="result"></div>
    </article>
  </section>

  <p class="footer">Built as a narrow public demonstration of the implemented research direction. The live endpoint stores no application-level conversation history and returns no claim of validated calibration, diagnosis, or safety improvement.</p>
</main>
<script>
(() => {
  const q = document.getElementById('question');
  const run = document.getElementById('run');
  const status = document.getElementById('status');
  const results = document.getElementById('results');
  const set = (id, value) => { document.getElementById(id).textContent = value ?? '—'; };

  run.addEventListener('click', async () => {
    const question = q.value.trim();
    if (question.length < 8) {
      status.textContent = 'Please enter a longer question';
      status.className = 'status warn';
      return;
    }
    run.disabled = true;
    status.textContent = 'Running…';
    status.className = 'status';
    results.classList.add('hidden');

    try {
      const response = await fetch('${LIVE_API_PATH}', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({question}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');

      set('initial', data.initial_answer);
      set('decision', data.review?.decision);
      set('failure', data.review?.failure_type);
      set('reason', data.review?.reason);
      set('uncertainty', data.uncertainty_note);
      set('model', data.model);
      set('latency', data.latency_ms ? data.latency_ms + ' ms' : '—');
      const usage = data.usage || {};
      const tokenText = [usage.prompt_tokens, usage.completion_tokens].some(Number.isFinite)
        ? (usage.prompt_tokens ?? 0) + ' in / ' + (usage.completion_tokens ?? 0) + ' out'
        : 'not reported';
      set('tokens', tokenText);
      set('final', data.final_answer);
      results.classList.remove('hidden');
      status.textContent = 'Live run complete';
      status.className = 'status ok';
    } catch (error) {
      status.textContent = error.message || 'Request failed';
      status.className = 'status error';
    } finally {
      run.disabled = false;
    }
  });
})();
</script>
</body>
</html>`;
}

function sanitizeStructuredResult(raw) {
  const review = raw?.review && typeof raw.review === 'object' ? raw.review : {};
  const decision = review.decision === 'revise' ? 'revise' : 'keep';
  const failureType = FAILURE_TYPES.has(review.failure_type)
    ? review.failure_type
    : 'OTHER';

  const initial = typeof raw?.initial_answer === 'string' ? raw.initial_answer.trim() : '';
  const finalAnswer = typeof raw?.final_answer === 'string' ? raw.final_answer.trim() : '';
  const reason = typeof review.reason === 'string' ? review.reason.trim() : '';
  const uncertainty = typeof raw?.uncertainty_note === 'string' ? raw.uncertainty_note.trim() : '';

  if (!initial || !finalAnswer) {
    throw new Error('Model response was missing required answer fields.');
  }

  return {
    initial_answer: initial,
    review: {
      decision,
      failure_type: failureType,
      reason: reason || 'No review rationale returned.',
    },
    final_answer: finalAnswer,
    uncertainty_note: uncertainty || 'No additional uncertainty note returned.',
  };
}

function parseModelJson(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Model returned an empty response.');
  }
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) return JSON.parse(fenced[1].trim());
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Model did not return valid JSON.');
  }
}

async function runLiveDemo(question, env) {
  if (!env.DEEPSEEK_API_KEY) {
    return jsonResponse(
      {
        error: 'Live inference is not configured on this deployment yet.',
        code: 'DEMO_NOT_CONFIGURED',
      },
      503,
    );
  }

  const model = env.DEEPSEEK_MODEL || DEFAULT_MODEL;
  const prompt = `Question from the user:\n${question}\n\nReturn JSON only.`;
  const system = `You are the public live-demo backend for CheckMyCoach, a research prototype about reliability of AI fitness information.

Your task has four steps inside one response:
1. Write a concise initial answer to the user's general fitness-information question.
2. Review that answer for one primary reliability failure.
3. If needed, revise it conservatively.
4. State the main uncertainty or missing context.

Use exactly this JSON schema:
{
  "initial_answer": "string",
  "review": {
    "decision": "keep" | "revise",
    "failure_type": "NONE" | "OVERPRECISION" | "MISSING_CONTEXT" | "UNSUPPORTED_CAUSAL" | "OTHER",
    "reason": "string"
  },
  "final_answer": "string",
  "uncertainty_note": "string"
}

Rules:
- Give general educational fitness information only, not diagnosis or treatment.
- If the question depends on pain, injury, medication, pregnancy, an eating disorder, a diagnosed condition, or another clinical factor, do not provide personalized instructions; say what information is missing and suggest an appropriate qualified professional.
- Do not invent study results, percentages, thresholds, or citations.
- Prefer calibrated language over false precision.
- The final answer should preserve useful information while removing unsupported certainty.
- Keep both answers under 180 words each.
- Return JSON only, with no markdown fences.`;

  const started = Date.now();
  const upstreamFetch = env.UPSTREAM_FETCH || fetch;
  const upstream = await upstreamFetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: 'json_object' },
    }),
  });

  const latencyMs = Date.now() - started;
  let payload;
  try {
    payload = await upstream.json();
  } catch {
    return jsonResponse({ error: 'Inference provider returned a non-JSON response.' }, 502);
  }

  if (!upstream.ok) {
    const providerMessage = payload?.error?.message || 'Inference provider request failed.';
    return jsonResponse({ error: providerMessage }, 502);
  }

  try {
    const text = payload?.choices?.[0]?.message?.content;
    const structured = sanitizeStructuredResult(parseModelJson(text));
    return jsonResponse({
      ...structured,
      model,
      latency_ms: latencyMs,
      usage: payload?.usage || null,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: 'The model response could not be parsed into the demo schema.',
        detail: error instanceof Error ? error.message : String(error),
      },
      502,
    );
  }
}

async function handleLiveApi(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, { allow: 'POST' });
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonResponse({ error: 'Expected application/json.' }, 415);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  if (question.length < 8) {
    return jsonResponse({ error: 'Question must be at least 8 characters.' }, 400);
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return jsonResponse({ error: `Question must be ${MAX_QUESTION_CHARS} characters or fewer.` }, 400);
  }

  return runLiveDemo(question, env);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const rawPath = url.pathname;
    const strippedPath = rawPath === GITHUB_PAGES_BASE || rawPath.startsWith(`${GITHUB_PAGES_BASE}/`)
      ? rawPath.slice(GITHUB_PAGES_BASE.length) || '/'
      : rawPath;
    const path = normalizePath(strippedPath);

    if (path === LIVE_DEMO_PATH && request.method === 'GET') {
      return new Response(liveDemoHtml(), {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'no-referrer',
        },
      });
    }

    if (path === LIVE_API_PATH) {
      return handleLiveApi(request, env);
    }

    if (strippedPath !== rawPath) {
      url.pathname = strippedPath;
      return env.ASSETS.fetch(new Request(url, request));
    }

    return env.ASSETS.fetch(request);
  },
};

export {
  handleLiveApi,
  liveDemoHtml,
  parseModelJson,
  sanitizeStructuredResult,
};
