import type { HighlightConfig } from './types';

export const HERO_HEADING = 'Stop asking customers to describe their issues';

export const HERO_HIGHLIGHTS: HighlightConfig[] = [
  { wordIndex: 2, color: 'blue' },
  { wordIndex: 6, color: 'yellow' },
];

export const HERO_DESCRIPTION =
  "Request screen recording with console logs, network data and user steps showing exactly what went wrong. See the issue through your customer's lens.";

export const HERO_PRIMARY_BUTTON = {
  text: 'Get Started',
  href: '/signup',
};

export const HERO_SECONDARY_BUTTON = {
  text: 'Contact Sales',
};

export const HERO_BADGE = {
  text: 'Public Beta',
};
