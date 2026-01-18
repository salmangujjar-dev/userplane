import { TALLY_SALES_FORM_URL } from './contact';
import { SIGNUP_URL } from './onboarding';
import type { HighlightConfig } from './types';

export const CTA_HEADING = 'See the bug not just a description of it';

export const CTA_HIGHLIGHTS: HighlightConfig[] = [
  { wordIndex: 2, color: 'blue' },
  { wordIndex: 6, color: 'yellow' },
];

export const CTA_DESCRIPTION =
  'One-click screen recording that lets you capture and replay customer issues. Stop the endless back-and-forth.';

export const CTA_PRIMARY_BUTTON = {
  text: 'Get Started',
  href: SIGNUP_URL,
};

export const CTA_SECONDARY_BUTTON = {
  text: 'Contact Sales',
  href: TALLY_SALES_FORM_URL,
  isExternal: true,
};
