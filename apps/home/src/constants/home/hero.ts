import type { HighlightConfig } from '@/types/highlight';

import { SIGNUP_URL } from '../onboarding';
import { buildUTM, withUTM } from '../utm';

export const HERO_HEADING = 'Resolve support issues without the back and forth';

export const HERO_HIGHLIGHTS: HighlightConfig[] = [
  { wordIndex: 1, color: 'yellow' },
  { wordIndex: 2, color: 'yellow' },
  { wordIndex: 5, color: 'blue' },
  { wordIndex: 6, color: 'blue' },
  { wordIndex: 7, color: 'blue' },
];

// export const HERO_DESCRIPTION =
// 'Request screen recordings from your customers showing exactly what went wrong. Capture logs, network requests, and session activity';

export const HERO_DESCRIPTION =
  'Request screen recordings with console logs, network requests, and session data. Resolve tickets up to 60% faster with full context upfront';

export const HERO_PRIMARY_BUTTON = {
  text: 'Get Started',
  href: withUTM(SIGNUP_URL, buildUTM('homepage', 'home', 'hero-primary')),
};

export const HERO_SECONDARY_BUTTON = {
  text: 'See Demo',
  href: '/demo',
};
