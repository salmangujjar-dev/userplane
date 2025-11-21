import type { HighlightConfig } from './types';
import { CAL_URL } from './contact';
import { SIGNUP_URL } from './onboarding';

export const HERO_HEADING = 'Stop asking customers to describe their issues';

export const HERO_HIGHLIGHTS: HighlightConfig[] = [
  { wordIndex: 2, color: 'blue' },
  { wordIndex: 6, color: 'yellow' },
];

export const HERO_DESCRIPTION =
  "Request screen recording with console logs, network data and user steps showing exactly what went wrong. See the issue through your customer's lens.";

export const HERO_PRIMARY_BUTTON = {
  text: 'Get Started',
  href: SIGNUP_URL,
};

export const HERO_SECONDARY_BUTTON = {
  text: 'Contact Sales',
  href: CAL_URL,
  isExternal: true,
};

export const HERO_BADGE = {
  text: 'Public Beta',
  href: CAL_URL,
  isExternal: true,
};
