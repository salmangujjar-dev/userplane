/**
 * Feature card data
 */
export interface Feature {
  image: string;
  imageAlt: string;
  title: string;
  description: string;
}

/**
 * Features section heading
 */
export const FEATURES_HEADING = {
  label: 'Features',
  title: 'Never Miss a Market Move',
};

/**
 * Features list
 */
export const FEATURES: Feature[] = [
  {
    image: '/images/features/market-intelligence.png',
    imageAlt: 'Market Intelligence',
    title: 'Market Intelligence',
    description:
      "Get a leg up with the sectors you're most interested in. Every change, no matter how small, gets flagged.",
  },
  {
    image: '/images/features/deal-intelligence.png',
    imageAlt: 'Deal Intelligence',
    title: 'Deal Intelligence',
    description:
      'Time your bets better. Track companies you passed on and re-engage when they hit key milestones. Turn comeback stories into portfolio wins.',
  },
  {
    image: '/images/features/relationship-intelligence.png',
    imageAlt: 'Relationship Intelligence',
    title: 'Relationship Intelligence',
    description:
      'Stay connected through pivots and false starts. Monitor passed opportunities for breakthrough moments. Be the investor they turn to.',
  },
  {
    image: '/images/features/competitive-intelligence.png',
    imageAlt: 'All Signal. No Noise.',
    title: 'Competitive Intelligence',
    description:
      "Track competitive threats to your portfolio companies. Whether it's roadmap updates, pricing shifts, or positioning plays, be the first to know.",
  },
];
