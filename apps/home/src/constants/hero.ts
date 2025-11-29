import type { HighlightConfig } from './types';
import { TALLY_SALES_FORM_URL } from './contact';
import { SIGNUP_URL } from './onboarding';

export const HERO_HEADING = 'One click screen recordings for Intercom';

export const HERO_ICON = {
  src: '/icons/intercom.webp',
  alt: 'Intercom',
  beforeWordIndex: 5,
};

export const HERO_HIGHLIGHTS: HighlightConfig[] = [
  { wordIndex: 2, color: 'yellow' },
  { wordIndex: 3, color: 'yellow' },
  { wordIndex: 5, color: 'blue' },
];

export const HERO_DESCRIPTION =
  "Request screen recording with console logs, network data and user steps showing exactly what went wrong. See the issue through your customer's lens.";

export const HERO_PRIMARY_BUTTON = {
  text: 'Get Started',
  href: SIGNUP_URL,
};

export const HERO_SECONDARY_BUTTON = {
  text: 'Contact Sales',
  href: TALLY_SALES_FORM_URL,
  isExternal: true,
};
