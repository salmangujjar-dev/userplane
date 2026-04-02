/**
 * Shared links and helpers for LLM-facing markdown endpoints
 * Used by /index.md, /pricing.md, /faq.md, /llms.txt, /llms-full.txt
 */

export interface LlmsLink {
  label: string;
  url: string;
}

/**
 * All LLM-facing links — single source of truth
 */
export const LLMS_LINKS: LlmsLink[] = [
  { label: 'Home', url: 'https://userplane.io/index.md' },
  { label: 'Pricing', url: 'https://userplane.io/pricing.md' },
  { label: 'FAQ', url: 'https://userplane.io/faq.md' },
  { label: 'Documentation', url: 'https://docs.userplane.io' },
  { label: 'Docs for LLMs', url: 'https://docs.userplane.io/llms.txt' },
  { label: 'Blog', url: 'https://userplane.io/blog' },
  { label: 'Help Center', url: 'https://userplane.io/help' },
  { label: 'Roadmap', url: 'https://userplane.io/roadmap' },
  { label: 'Demo', url: 'https://userplane.io/demo' },
  { label: 'Contact Us', url: 'https://docs.userplane.io/support/contact.md' },
];

/**
 * Format a subset of links as a markdown bullet list
 */
export function formatLlmsLinks(exclude?: string[]): string {
  const links = exclude ? LLMS_LINKS.filter((link) => !exclude.includes(link.label)) : LLMS_LINKS;
  return links.map((link) => `- [${link.label}](${link.url})`).join('\n');
}
