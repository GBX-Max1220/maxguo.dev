export const SITE = Object.freeze({
  origin: 'https://gbx-max1220.github.io',
  base: '/maxguo.dev',
  url: 'https://gbx-max1220.github.io/maxguo.dev',
  title: 'Baixin Guo',
  description: 'LLM Calibration & Trust in AI Coaching | Baixin Guo',
});

export function siteUrl(path = '') {
  const relativePath = String(path).replace(/^\/+/, '');
  return new URL(relativePath, `${SITE.url}/`).href;
}
