import type { HighlightConfig } from './types';

export const HERO_HEADING = "We monitor your companies so you don't have to";

export const HERO_HIGHLIGHTS: HighlightConfig[] = [
  { wordIndex: 1, color: 'blue' },
  { wordIndex: 3, color: 'yellow' },
];

export const HERO_DESCRIPTION =
  'Keep tabs on companies and competitors that matter to you. Stay connected through pivots and false starts. Time your bets better.';

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
