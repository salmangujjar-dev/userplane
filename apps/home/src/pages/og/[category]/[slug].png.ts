// Single build-time endpoint that generates every OG image.
//
// Astro walks getStaticPaths() once and writes each result as a static file:
//   dist/og/{category}/{slug}.png
//
// Pages reference these via getOgImagePath() — same URL, no drift.

import type { APIRoute, GetStaticPaths } from 'astro';

import { renderOgImage } from '@/lib/og/render';
import { enumerateOgSources, type OgSource } from '@/lib/og/sources';

export const getStaticPaths: GetStaticPaths = async () => {
  const sources = await enumerateOgSources();
  return sources.map((source) => ({
    params: { category: source.category, slug: source.slug },
    props: { source },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgImage(props.source as OgSource);

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
