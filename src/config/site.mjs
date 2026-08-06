export const SITE = Object.freeze({
  origin: 'https://gbx-max1220.github.io',
  base: '/maxguo.dev',
  url: 'https://gbx-max1220.github.io/maxguo.dev',
  title: 'Baixin Guo',
  description: 'I study how AI systems communicate reliability, uncertainty, and numerical precision—and how these signals shape human reliance and decision quality',
});

export function siteUrl(path = '') {
  const relativePath = String(path).replace(/^\/+/, '');
  return new URL(relativePath, `${SITE.url}/`).href;
}
