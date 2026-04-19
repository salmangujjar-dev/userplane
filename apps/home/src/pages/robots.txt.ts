import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('/sitemap-index.xml', site);
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    'Content-Signal: ai-train=yes, search=yes, ai-input=yes',
    '',
    `Sitemap: ${sitemapUrl.href}`,
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  });
};
