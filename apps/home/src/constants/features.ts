import { mediaClient } from '../lib/media';

/**
 * Feature card data
 */
export interface Feature {
  image: string;
  imageAlt: string;
  title: string;
  description: string;
}

/**
 * Features section heading
 */
export const FEATURES_HEADING = {
  label: 'Features',
  title: 'Stop guessing what went wrong',
};

/**
 * Features list
 * Images are served from CDN with Cloudflare Image Transforms
 */
export const FEATURES: Feature[] = [
  {
    image: mediaClient.getFeatureMediaUrl('features/one-click-screen-recordings.png'),
    imageAlt: 'One Click Recordings',
    title: 'One Click Recordings',
    description:
      'One-click recording links that works everywhere. No apps, installs, or browser extensions needed. A simple link that lets you capture and replay the issue.',
  },
  {
    image: mediaClient.getFeatureMediaUrl('features/complete-issue-context.png'),
    imageAlt: 'Complete Issue Context',
    title: 'Complete Issue Context',
    description:
      'Capture console errors, network activity, user steps, and error traces with every recording. Get complete visibility into customer issue.',
  },
  {
    image: mediaClient.getFeatureMediaUrl('features/native-integrations.png'),
    imageAlt: 'Intercom Native',
    title: 'Intercom Native',
    description:
      'Best-in-class Intercom integration. Request and receive screen recordings without leaving Intercom. No context switching required.',
  },
  {
    image: mediaClient.getFeatureMediaUrl('features/privacy-and-security.png'),
    imageAlt: 'Enterprise Ready',
    title: 'Enterprise Ready',
    description:
      'Auto-blur sensitive data. Bring your own storage. Enforce data-lifecycle and residency rules with enterprise-grade auditability, SAML SSO, and granular RBAC.',
  },
];
