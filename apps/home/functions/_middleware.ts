const PREBUILT_MD: Record<string, string> = {
  '/': '/index.md',
  '/pricing': '/pricing.md',
  '/faq': '/faq.md',
};

function wantsMarkdown(request: Request): boolean {
  const accept = request.headers.get('Accept') || '';
  return accept.includes('text/markdown');
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;

  if (!wantsMarkdown(request)) {
    return context.next();
  }

  const url = new URL(request.url);
  const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '');

  const mdPath = PREBUILT_MD[pathname];
  if (!mdPath) {
    return context.next();
  }

  const mdUrl = new URL(mdPath, request.url);
  const mdResponse = await context.env.ASSETS.fetch(mdUrl);

  if (!mdResponse.ok) {
    return context.next();
  }

  const markdown = await mdResponse.text();

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(estimateTokens(markdown)),
      Vary: 'Accept',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
