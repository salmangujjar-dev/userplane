import type { HighlightConfig } from '../types';

/**
 * Pricing section heading
 */
export const PRICING_HEADING = {
  label: 'Pricing',
  title: 'Pricing that works for you',
  subtitle: 'Month to month. Flat rate. No long-term contracts. No cancellation fees.',
};

/**
 * Pricing heading highlights configuration
 */
export const PRICING_HIGHLIGHTS: HighlightConfig[] = [
  { wordIndex: 0, color: 'yellow' },
  { wordIndex: 2, color: 'blue' },
];
