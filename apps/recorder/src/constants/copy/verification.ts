/**
 * Verification screen copy
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

export const VERIFICATION_ERROR_COPY = {
  tokenInvalid: {
    title: 'This link has expired',
    subtitle: 'Just request a new verification link to continue.',
  },
  domainNotRegistered: {
    title: "We can't find this domain yet",
    subtitle: 'Once you add the domain to your workspace, you can come back and verify it.',
  },
  workspaceMismatch: {
    title: 'Workspace mismatch',
    subtitle:
      'This link belongs to another workspace. Review your domain and workspace settings and try again.',
  },
  urlInvalid: {
    title: 'Invalid domain',
    subtitle: "The domain doesn't look right, let's double check and try again.",
  },
  originInvalid: {
    title: 'Invalid origin',
    subtitle: 'For security reasons, this step needs to happen from the registered domain.',
  },
  originMismatch: {
    title: 'Origin mismatch',
    subtitle: "Let's open this link from the domain you're trying to verify.",
  },
  verificationFailed: {
    title: 'Verification failed',
    subtitle: 'Could not verify domain ownership. Try again, or review your domain settings.',
  },
  networkError: {
    title: 'Connection issue',
    subtitle: "We couldn't reach the servers. Let's try again.",
  },
  unknownError: {
    title: 'Something went wrong',
    subtitle: "That didn't work. Let's try again.",
  },
} as const;
