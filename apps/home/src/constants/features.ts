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
  title: 'See the cause not the symptoms',
};

/**
 * Features list
 */
export const FEATURES: Feature[] = [
  {
    image: '/images/features/one-click-recordings.png',
    imageAlt: 'One Click Recordings',
    title: 'One Click Recordings',
    description:
      'One-click recording links that works everywhere. No apps, installs, or browser extensions needed. A simple link that lets you capture and replay the issue.',
  },
  {
    image: '/images/features/complete-issue-context.png',
    imageAlt: 'Complete Issue Context',
    title: 'Complete Issue Context',
    description:
      'Capture console errors, network activity, user steps, and error traces with every recording. Get complete visibility into customer issue.',
  },
  {
    image: '/images/features/native-integrations.png',
    imageAlt: 'Native Integrations',
    title: 'Native Integrations',
    description:
      'Best in class integrations with help desks, issue trackers, CRM, and support tools you already use. No context switching required.',
  },
  {
    image: '/images/features/enterprise-ready.png',
    imageAlt: 'Enterprise Ready',
    title: 'Enterprise Ready',
    description:
      'Auto-blur sensitive data. Bring your own storage. Enforce data-lifecycle and residency rules with enterprise-grade auditability, SAML SSO, and granular RBAC.',
  },
];
