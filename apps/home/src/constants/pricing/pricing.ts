import type { HighlightConfig } from '@/types/highlight';

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
  { wordIndex: 0, color: 'blue' },
  { wordIndex: 2, color: 'yellow' },
];
