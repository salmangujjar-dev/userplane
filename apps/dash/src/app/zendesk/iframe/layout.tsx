import type { Metadata } from 'next';

/**
 * Minimal layout for the Zendesk iframe page.
 * No sidebar, no navigation, no dashboard providers.
 *
 * The ZAF SDK script is loaded by ClientProvider (not here) to avoid
 * hydration mismatches from beforeInteractive and to keep the lifecycle
 * in one place.
 *
 * CSP header is set via next.config headers().
 */
export const metadata: Metadata = {
  title: 'Userplane',
};

export default function ZendeskIframeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
