// Central source of truth for all OG images.
//
// enumerateOgSources() — used by the SSG endpoint's getStaticPaths to know
//   what images to generate.
// getOgImagePath()     — used by pages/layouts to know what URL to reference
//   in <meta property="og:image">. Pure function, no async, no getCollection.

import { getCollection } from 'astro:content';

import { FRAMEWORK_REGISTRY } from '@/constants/frameworks/registry';
import { INTEGRATION_REGISTRY } from '@/constants/integrations/registry';
import { ROLE_REGISTRY } from '@/constants/roles/registry';
import type { StaticPageCategory } from '@/constants/static-pages';
import { STATIC_PAGE_REGISTRY } from '@/constants/static-pages';

// StaticPageCategory covers the non-dynamic pages; add the four dynamic types here.
// If StaticPageCategory gains a new value, OgCategory inherits it automatically.
export type OgCategory = StaticPageCategory | 'integration' | 'framework' | 'role' | 'blog';

export interface OgSource {
  category: OgCategory;
  /** URL-safe slug — becomes the filename: /og/{category}/{slug}.png */
  slug: string;
  /** Small label above the headline */
  eyebrow: string;
  /** Large headline — keep ≤ 80 chars for safe wrapping */
  title: string;
  /** 1–2 line description below the headline */
  subtitle: string;
  /** og:image:alt text */
  alt: string;
}

// ── Static sources (registry-backed) ─────────────────────────────────────────
// Driven by STATIC_PAGE_REGISTRY — one entry per non-dynamic, non-collection page.
// Adding a new static page: add an entry to src/constants/static-pages.ts; done.

const STATIC_SOURCES: OgSource[] = Object.values(STATIC_PAGE_REGISTRY).map((entry) => ({
  category: entry.category,
  slug: entry.slug,
  eyebrow: entry.og.eyebrow,
  title: entry.og.title,
  subtitle: entry.seo.description,
  alt: entry.og.alt,
}));

// ── Dynamic sources (registry- and collection-backed) ────────────────────────

export async function enumerateOgSources(): Promise<OgSource[]> {
  const sources: OgSource[] = [...STATIC_SOURCES];

  for (const config of Object.values(INTEGRATION_REGISTRY)) {
    sources.push({
      category: 'integration',
      slug: config.slug,
      eyebrow: config.name,
      // Clean card title — avoids the keyword-stuffed seo.title
      title: `${config.name} Integration`,
      subtitle: config.seo.description,
      alt: `Userplane for ${config.name}`,
    });
  }

  for (const config of Object.values(FRAMEWORK_REGISTRY)) {
    sources.push({
      category: 'framework',
      slug: config.slug,
      eyebrow: config.name,
      title: `Userplane for ${config.name}`,
      subtitle: config.seo.description,
      alt: `Userplane for ${config.name}`,
    });
  }

  for (const config of Object.values(ROLE_REGISTRY)) {
    sources.push({
      category: 'role',
      slug: config.slug,
      eyebrow: 'For Teams',
      title: `Userplane for ${config.name}`,
      subtitle: config.seo.description,
      alt: `Userplane for ${config.name}`,
    });
  }

  // Blog posts — empty collection today; wired for when posts land.
  const posts = await getCollection('blog');
  for (const post of posts) {
    sources.push({
      category: 'blog',
      // Normalise .md suffix that may or may not be present in post.id
      slug: post.id.replace(/\.md$/, ''),
      eyebrow: post.data.category,
      // Guard against very long titles overflowing the card headline
      title: post.data.title.length > 80 ? `${post.data.title.slice(0, 77)}…` : post.data.title,
      subtitle: post.data.excerpt,
      alt: post.data.title,
    });
  }

  return sources;
}

// ── URL helpers ───────────────────────────────────────────────────────────────

/** Pure URL helper — call from any .astro page without async. */
export function getOgImagePath(category: OgCategory, slug: string): string {
  return `/og/${category}/${slug}.png`;
}
