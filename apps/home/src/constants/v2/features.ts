import type { HighlightConfig } from '../types';

/**
 * Feature card data
 */
export interface Feature {
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  icon: string;
}

/**
 * Features section heading
 */
export const FEATURES_HEADING = {
  label: 'Features',
  title: 'Stop guessing what went wrong',
  subtitle: 'See exactly what went wrong, without the back and forth',
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
 */
export const FEATURES: Feature[] = [
  {
    image: '/images/features/one-click-recordings.webp',
    imageAlt: 'One click recordings',
    title: 'One click recordings',
    description:
      'One-click recording links that works everywhere. No apps, installs, or browser extensions needed. A simple link that lets you capture and replay the issue.',
    icon: 'Play',
  },
  {
    image: '/images/features/complete-issue-context.webp',
    imageAlt: 'Capture logs & errors',
    title: 'Capture logs & errors',
    description:
      'Get console errors, network activity, user steps, and error traces with every recording. Give engineering teams everything they need to fix the issue faster.',
    icon: 'SquareTerminal',
  },
  {
    image: '/images/features/enterprise-ready.webp',
    imageAlt: 'Replay customer issues',
    title: 'Replay customer issues',
    description:
      'Watch exactly what went wrong. Review and replay customer sessions without the back and forth. Get complete visibility into the customer issue.',
    icon: 'BugPlay',
  },
  {
    image: '/images/features/native-integrations.webp',
    imageAlt: 'Native Intercom integration',
    title: 'Native Intercom integration',
    description:
      'Best-in-class Intercom integration. Request and receive screen recordings without leaving Intercom. Recordings live where your team works.',
    icon: 'Puzzle',
  },
];
