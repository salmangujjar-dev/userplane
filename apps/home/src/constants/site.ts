/**
 * Site metadata configuration
 */
export interface SiteMeta {
  title: string;
  description: string;
  keywords: string;
  locale: string;
  favicon: string;
}

/**
 * Site metadata
 */
export const SITE_META: SiteMeta = {
  title: 'Subsignal - Never Miss a Market Move',
  description:
    'Be the investor founders turn to. Monitor companies you passed on and keep your sector thesis current',
  keywords:
    'market intelligence, competitive intelligence, deal intelligence, relationship intelligence, market moves, portfolio monitoring, investment tracking, sector thesis',
  locale: 'en_US',
  favicon: '/favicon.svg',
};
