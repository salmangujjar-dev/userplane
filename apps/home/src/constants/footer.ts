import { TALLY_COMPLIANCE_FORM_URL } from './contact';
import { NAV_LINKS } from './navigation';
import { getMarketingUrl } from './urls';

/**
 * Footer copyright text
 */
export const FOOTER_COPYRIGHT = 'Userplane. All rights reserved.';

const ASK_QUERY = encodeURIComponent(
  "What does Userplane(tryuserplane.com) do? It's a support tool that helps SaaS teams resolve support issues faster by capturing recordings, logs, and session data from customer\nRead: https://userplane.io/index.md"
);

/**
 * "Ask about Userplane on" AI chat links
 */
export const FOOTER_AI_LINKS = [
  {
    label: 'ChatGPT',
    icon: '/icons/chatgpt.svg',
    href: `https://chatgpt.com/?q=${ASK_QUERY}`,
  },
  {
    label: 'Claude',
    icon: '/icons/claude.svg',
    href: `https://claude.ai/new?q=${ASK_QUERY}`,
  },
  {
    label: 'Perplexity',
    icon: '/icons/perplexity.svg',
    href: `https://www.perplexity.ai/search?q=${ASK_QUERY}`,
  },
  {
    label: 'Gemini',
    icon: '/icons/gemini.svg',
    href: 'https://gemini.google.com/share/1dc00ffdf75c',
  },
  {
    label: 'Grok',
    icon: '/icons/grok.svg',
    href: `https://grok.com/?q=${ASK_QUERY}`,
  },
] as const;

/**
 * Footer navigation links organized by section
 */
export const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'FAQ', href: '/#faq' },
  ],
  company: [
    { label: 'Blog', href: NAV_LINKS.blog },
    { label: 'Roadmap', href: NAV_LINKS.roadmap },
    { label: 'Help Center', href: NAV_LINKS.help },
  ],
  legal: [
    { label: 'Privacy Policy', href: getMarketingUrl('/privacy') },
    { label: 'Terms of Service', href: getMarketingUrl('/terms') },
    { label: 'Compliance Request', href: TALLY_COMPLIANCE_FORM_URL },
  ],
} as const;
