export const SITE = Object.freeze({
  origin: 'https://gbx-max1220.github.io',
  base: '/maxguo.dev',
  url: 'https://gbx-max1220.github.io/maxguo.dev',
  title: 'Baixin Guo',
  description: 'Designing and evaluating human-centered AI systems for evidence-bounded decision support.',
});

export function siteUrl(path = '') {
  const relativePath = String(path).replace(/^\/+/, '');
  return new URL(relativePath, `${SITE.url}/`).href;
}
