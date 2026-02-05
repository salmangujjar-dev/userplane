import { mediaClient } from '../lib/media';
import type { HighlightConfig } from './types';

/**
 * Feature card data
 */
export interface Feature {
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  icon: string;
  url: string;
}

/**
 * Features section heading
 */
export const FEATURES_HEADING = {
  label: 'Features',
  title: 'Stop guessing what went wrong',
  subtitle: 'Resolve customer issues without the back and forth',
};

/**
 * Features heading highlights configuration
 */
export const FEATURES_HIGHLIGHTS: HighlightConfig[] = [
  { wordIndex: 1, color: 'yellow' },
  { wordIndex: 4, color: 'blue' },
];

/**
 * Features list
 * Images are served from CDN with Cloudflare Image Transforms
 */
export const FEATURES: Feature[] = [
  {
    image: mediaClient.getFeatureMediaUrl('features/one-click-screen-recordings.png'),
    imageAlt: 'One click recordings',
    title: 'One click recordings',
    description:
      'One-click recording links that works everywhere. No apps, installs, or browser extensions needed. A simple link that lets you capture and replay the issue.',
    icon: 'Play',
    url: 'app.userplane.io/record',
  },
  {
    image: mediaClient.getFeatureMediaUrl('features/complete-issue-context.png'),
    imageAlt: 'Replay customer issues',
    title: 'Replay customer issues',
    description:
      'Watch exactly what went wrong. Review and replay customer sessions without the back and forth. Get complete visibility into the customer issue.',
    icon: 'BugPlay',
    url: 'app.userplane.io/replay',
  },
  {
    image: mediaClient.getFeatureMediaUrl('features/native-integrations.png'),
    imageAlt: 'Native Intercom integration',
    title: 'Native Intercom integration',
    description:
      'Best-in-class Intercom integration. Request and receive screen recordings without leaving Intercom. Recordings live where your team works.',
    icon: 'Puzzle',
    url: 'app.userplane.io/integrations',
  },
  {
    image: mediaClient.getFeatureMediaUrl('features/privacy-and-security.png'),
    imageAlt: 'Privacy and security controls',
    title: 'Privacy and security built-in',
    description:
      'Automatically blur sensitive data and redact confidential fields. Ensure compliance while building trust with your customers.',
    icon: 'Shield',
    url: 'app.userplane.io/privacy',
  },
];
