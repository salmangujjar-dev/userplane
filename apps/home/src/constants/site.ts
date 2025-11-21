/**
 * Site metadata configuration
 */
export interface SiteMeta {
  title: string;
  description: string;
  keywords: string;
  locale: string;
  favicon: string;
  ogImage: string;
}

/**
 * Site metadata
 */
export const SITE_META: SiteMeta = {
  title: 'Userplane - One Click Screen Recordings for Customer Support',
  description:
    "Request screen recording with console logs, network data and user steps showing exactly what went wrong. See the issue through your customer's lens",
  keywords:
    'screen recording for support teams, request customer screen recording, remote screen support tool, userplane, userplane screen recording, userplane customer support, capture network logs, error traces recording, customer screen capture, screen recording tool, support team tools, customer issue tracking, bug reproduction, console logs capture',
  locale: 'en_US',
  favicon: '/favicon.svg',
  ogImage: '/images/preview/preview.webp',
};
