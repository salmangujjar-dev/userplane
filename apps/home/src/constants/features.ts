import { mergeTransformOptions } from '@userplane/storage/media';

import { mediaClient } from '../lib/media';
import type { HighlightConfig } from './types';

/**
 * Feature card data
 */
export interface Feature {
  image: string;
  imageMobile: string;
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
  subtitle: "See the issue through your customer's lens",
};

/**
 * Features heading highlights configuration
 */
export const FEATURES_HIGHLIGHTS: HighlightConfig[] = [
  { wordIndex: 1, color: 'blue' },
  { wordIndex: 4, color: 'yellow' },
];

/**
 * Features list
 * Images are served from CDN with Cloudflare Image Transforms
 */
export const FEATURES: Feature[] = [
  {
    image: mediaClient.getFeatureMediaUrl('features/one-click-screen-recordings.webp', {
      transform: mergeTransformOptions('feature', { width: 1400 }),
    }),
    imageMobile: mediaClient.getFeatureMediaUrl('features/one-click-screen-recordings.webp', {
      transform: mergeTransformOptions('feature', { width: 700 }),
    }),
    imageAlt: 'One click recordings',
    title: 'One click recordings',
    description:
      'One-click recording links that works everywhere. No apps, installs, or browser extensions needed. A simple link that lets you capture and replay the issue.',
  },
  {
    image: mediaClient.getFeatureMediaUrl('features/complete-issue-context.webp', {
      transform: mergeTransformOptions('feature', { width: 1400 }),
    }),
    imageMobile: mediaClient.getFeatureMediaUrl('features/complete-issue-context.webp', {
      transform: mergeTransformOptions('feature', { width: 700 }),
    }),
    imageAlt: 'Complete Issue Context',
    title: 'Complete Issue Context',
    description:
      'Capture console errors, network activity, user steps, and error traces with every recording. Get complete visibility into customer issue.',
  },
  {
    image: mediaClient.getFeatureMediaUrl('features/native-integrations.webp', {
      transform: mergeTransformOptions('feature', { width: 1400 }),
    }),
    imageMobile: mediaClient.getFeatureMediaUrl('features/native-integrations.webp', {
      transform: mergeTransformOptions('feature', { width: 700 }),
    }),
    imageAlt: 'Native Intercom integration',
    title: 'Native Intercom integration',
    description:
      'Best-in-class Intercom integration. Request and receive screen recordings without leaving Intercom. Recordings live where your team works.',
  },
  {
    image: mediaClient.getFeatureMediaUrl('features/privacy-and-security.webp', {
      transform: mergeTransformOptions('feature', { width: 1400 }),
    }),
    imageMobile: mediaClient.getFeatureMediaUrl('features/privacy-and-security.webp', {
      transform: mergeTransformOptions('feature', { width: 700 }),
    }),
    imageAlt: 'Privacy and security controls',
    title: 'Privacy and security built-in',
    description:
      'Automatically blur sensitive data and redact confidential fields. Ensure compliance while building trust with your customers.',
  },
];
