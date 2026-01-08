/**
 * Verification screen copy
 * Error copy is in lib/verification-errors.ts
 */

export const VERIFICATION_COPY = {
  verifying: {
    title: 'Verifying domain',
    subtitle: 'This should only take a few seconds.',
    subtitleWithDomain: (domain: string) => `We're checking that ${domain} is yours.`,
  },
  verified: {
    title: 'Domain verified',
    subtitle: (domain: string) => `${domain} is ready to use.`,
    closeInfo: 'This window will close automatically.',
  },
} as const;
