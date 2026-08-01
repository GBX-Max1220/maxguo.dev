const GITHUB_PAGES_BASE = '/maxguo.dev';

/**
 * Serve the same static build on both GitHub Pages and Cloudflare Workers.
 *
 * The generated HTML intentionally contains /maxguo.dev-prefixed links for
 * GitHub Pages. Cloudflare stores the assets at the Worker root, so requests
 * carrying that prefix are mapped back to the corresponding root asset.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (
      url.pathname === GITHUB_PAGES_BASE ||
      url.pathname.startsWith(`${GITHUB_PAGES_BASE}/`)
    ) {
      url.pathname = url.pathname.slice(GITHUB_PAGES_BASE.length) || '/';
      return env.ASSETS.fetch(new Request(url, request));
    }

    return env.ASSETS.fetch(request);
  },
};
