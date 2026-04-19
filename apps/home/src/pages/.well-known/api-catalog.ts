import type { APIRoute } from 'astro';

const catalog = {
  linkset: [
    {
      anchor: 'https://api.userplane.io/api/v1',
      links: [
        {
          rel: 'service-desc',
          href: 'https://docs.userplane.io/openapi.json',
          type: 'application/vnd.oai.openapi+json',
        },
        {
          rel: 'service-doc',
          href: 'https://docs.userplane.io/api/introduction',
        },
      ],
    },
    {
      anchor: 'https://api.userplane.io/mcp',
      links: [
        {
          rel: 'service-doc',
          href: 'https://docs.userplane.io/integrations/mcp',
        },
      ],
    },
  ],
};

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      'Content-Type': 'application/linkset+json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
