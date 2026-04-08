import type { HighlightConfig } from '@/types/highlight';

import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { buildUTM, withUTM } from '../utm';

export const CTA_HEADING = 'See the bug not just a description of it';

export const CTA_HIGHLIGHTS: HighlightConfig[] = [
  { wordIndex: 2, color: 'yellow' },
  { wordIndex: 6, color: 'blue' },
];

export const CTA_DESCRIPTION =
  'One-click screen recording that lets you capture and replay customer issues. Stop the endless back-and-forth.';

export const CTA_PRIMARY_BUTTON = {
  text: 'Get Started',
  href: withUTM(SIGNUP_URL, buildUTM('homepage', 'home', 'cta-primary')),
};

export const CTA_SECONDARY_BUTTON = {
  text: 'Talk to a Human',
  href: withUTM(TALLY_SALES_FORM_URL, buildUTM('homepage', 'home', 'cta-secondary')),
  isExternal: true,
};
