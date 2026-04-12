// Single registry for every non-dynamic, non-collection page.
//
// Two things read from this:
//   1. Each .astro page reads seo.{title,description,keywords} for its
//      <meta> tags and og.alt for og:image:alt.
//   2. enumerateOgSources() in src/lib/og/sources.ts iterates this registry
//      to generate OG card images at build time.
//
// The registry uses the same shape as INTEGRATION_REGISTRY / FRAMEWORK_REGISTRY /
// ROLE_REGISTRY so the access pattern is consistent across all page types:
//   config.seo.description is always the canonical description for a page.
//
// Adding a new static page:
//   1. Add an entry here.
//   2. Read STATIC_PAGE_REGISTRY.<key> in the new .astro page.
//   Done — the OG image generates automatically.

export type StaticPageCategory = 'home' | 'static' | 'launch' | 'listing';

export interface StaticPageEntry {
  /** OG endpoint category — drives /og/{category}/{slug}.png */
  category: StaticPageCategory;
  /** OG endpoint slug — becomes the filename */
  slug: string;
  seo: {
    /** <title> */
    title: string;
    /** <meta name="description"> AND OG card subtitle — single source of truth */
    description: string;
    /** <meta name="keywords"> */
    keywords: string;
  };
  og: {
    /** Small label above the OG card headline */
    eyebrow: string;
    /** OG card headline — short and punchy, not the same as seo.title */
    title: string;
    /** og:image:alt */
    alt: string;
  };
}

export const STATIC_PAGE_REGISTRY = {
  home: {
    category: 'home',
    slug: 'index',
    seo: {
      title: 'Userplane — Resolve Support Tickets Faster with One-Click Screen Recordings',
      description:
        'Request screen recordings with console logs, network data, and session data. Resolve tickets 60% faster. Works with Intercom, Zendesk, Slack — start free.',
      keywords:
        'screen recording, customer support screen recording, one click screen recording, customer debugging tool, userplane, support team tools, bug reproduction, console logs capture, intercom screen recording, zendesk screen recording',
    },
    og: {
      eyebrow: 'Userplane',
      title: 'Screen Recordings for Customer Support',
      alt: 'Userplane — screen recordings for customer support',
    },
  },

  pricing: {
    category: 'static',
    slug: 'pricing',
    seo: {
      title: 'Pricing - Userplane',
      description:
        'Simple, transparent pricing for teams of all sizes. Choose the plan that fits your needs with no hidden fees.',
      keywords: 'pricing, plans, screen recording, customer support, debugging, Userplane pricing',
    },
    og: {
      eyebrow: 'Pricing',
      title: 'Simple, transparent pricing',
      alt: 'Userplane pricing plans',
    },
  },

  demo: {
    category: 'static',
    slug: 'demo',
    seo: {
      title: 'Demo | Userplane - See Screen Recordings in Action',
      description:
        'See Userplane in action. Interactive product demo showing how to request and capture screen recordings from your customers.',
      keywords:
        'userplane demo, product demo, screen recording demo, interactive demo, customer support demo',
    },
    og: {
      eyebrow: 'Demo',
      title: 'See Userplane in action',
      alt: 'Userplane interactive demo',
    },
  },

  help: {
    category: 'static',
    slug: 'help',
    seo: {
      title: 'Help Center | Userplane',
      description: 'Find answers, guides, and resources to get the most out of Userplane',
      keywords:
        'userplane help, help center, screen recording help, customer support help, userplane faq, getting started, integrations help',
    },
    og: {
      eyebrow: 'Help',
      title: 'Help & support',
      alt: 'Userplane help center',
    },
  },

  roadmap: {
    category: 'static',
    slug: 'roadmap',
    seo: {
      title: 'Roadmap — Userplane',
      description: "See what's coming next and help shape our development priorities.",
      keywords:
        'userplane roadmap, product roadmap, upcoming features, screen recording features, feature requests',
    },
    og: {
      eyebrow: 'Roadmap',
      title: 'What we are building next',
      alt: 'Userplane product roadmap',
    },
  },

  privacy: {
    category: 'static',
    slug: 'privacy',
    seo: {
      title: 'Privacy Policy',
      description:
        "Userplane's privacy policy. Learn how we collect, use, and protect your data when using our screen recording and customer support tools.",
      keywords:
        'userplane privacy policy, data protection, screen recording privacy, customer data security, GDPR, CCPA',
    },
    og: {
      eyebrow: 'Legal',
      title: 'Privacy policy',
      alt: 'Userplane privacy policy',
    },
  },

  terms: {
    category: 'static',
    slug: 'terms',
    seo: {
      title: 'Terms of Service',
      description:
        "Userplane's terms of service. Read the terms and conditions governing the use of our screen recording and customer support platform.",
      keywords: 'userplane terms of service, terms and conditions, user agreement',
    },
    og: {
      eyebrow: 'Legal',
      title: 'Terms of service',
      alt: 'Userplane terms of service',
    },
  },

  blog: {
    category: 'static',
    slug: 'blog',
    seo: {
      title: 'Blog | Userplane',
      description:
        'Tips, guides, and updates from the Userplane team on customer support, screen recordings, and debugging workflows.',
      keywords:
        'userplane blog, customer support tips, screen recording guides, debugging workflows, support team resources',
    },
    og: {
      eyebrow: 'Blog',
      title: 'The Userplane blog',
      alt: 'Userplane blog',
    },
  },

  launch: {
    category: 'launch',
    slug: 'index',
    seo: {
      title: 'Userplane — Screen Recordings for Customer Support',
      description:
        'Send a recording link. Get back a full replay with console logs, network requests, and session data. Built for support teams.',
      keywords:
        'screen recording, customer support, bug reporting, session replay, console logs, network requests, userplane, product hunt',
    },
    og: {
      eyebrow: 'Launch',
      title: 'Resolve issues without the back-and-forth',
      alt: 'Userplane launch',
    },
  },

  integrationsListing: {
    category: 'listing',
    slug: 'integrations',
    seo: {
      title: 'Integrations | Userplane - Screen Recordings for Your Support Stack',
      description:
        'Send recording links to customers. Get back a full replay with logs, network data, and user context.',
      keywords:
        'userplane integrations, screen recording integrations, support tool integrations, intercom integration, zendesk integration, slack integration, chrome extension',
    },
    og: {
      eyebrow: 'Integrations',
      title: 'Screen recordings for your support stack',
      alt: 'Userplane integrations',
    },
  },

  frameworksListing: {
    category: 'listing',
    slug: 'frameworks',
    seo: {
      title: 'Userplane for Your Framework | Screen Recordings with Console Logs',
      description:
        'Capture console logs, network requests, and session details from Next.js, React, Remix, Vue, Angular, Svelte, Nuxt, Astro, SolidJS, Django, Ruby on Rails, and more.',
      keywords:
        'screen recording sdk, session replay frameworks, nextjs screen recording, react session replay, remix screen recording, remix session replay, vue screen recording, angular debugging, svelte session capture, solidjs screen recording, django session replay, rails screen recording, userplane',
    },
    og: {
      eyebrow: 'Frameworks',
      title: 'Screen recordings for every framework',
      alt: 'Userplane frameworks',
    },
  },

  forListing: {
    category: 'listing',
    slug: 'for',
    seo: {
      title:
        'Userplane for Your Team | Screen Recordings with Console Logs, Network Requests, and Session Data',
      description:
        'Userplane gives every team full visibility into customer issues. Screen recordings with console logs, network data, and session metadata.',
      keywords:
        'userplane, screen recording, session replay, support tools, developer tools, customer success, console logs, network data',
    },
    og: {
      eyebrow: 'Teams',
      title: 'Userplane for every team',
      alt: 'Userplane for teams',
    },
  },
} as const satisfies Record<string, StaticPageEntry>;
