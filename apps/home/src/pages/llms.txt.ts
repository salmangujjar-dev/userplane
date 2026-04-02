import type { APIRoute } from 'astro';

import { HERO_DESCRIPTION, HERO_HEADING } from '@/constants/hero';
import { formatLlmsLinks } from '@/constants/llms';

const content = `# Userplane - ${HERO_HEADING}

> ${HERO_DESCRIPTION}

${formatLlmsLinks()}
`;

export const GET: APIRoute = () => {
  return new Response(content.trim(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
