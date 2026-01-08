/**
 * Verification screen copy
 */

export const VERIFICATION_COPY = {
  verifying: {
    title: 'Verifying domain',
    subtitle: 'This will only take a moment',
    subtitleWithDomain: (domain: string) => `Checking ownership of ${domain}`,
  },
  verified: {
    title: 'Domain verified',
    subtitle: (domain: string) => `${domain} has been successfully verified.`,
    closeInfo: 'This window will close automatically',
  },
} as const;

export const VERIFICATION_ERROR_COPY = {
  tokenInvalid: {
    title: 'Invalid verification token',
    subtitle:
      'The verification token is invalid or has expired. Please request a new verification link.',
  },
  domainNotRegistered: {
    title: 'Domain not found',
    subtitle: 'This domain is not registered in your workspace. Please add the domain first.',
  },
  workspaceMismatch: {
    title: 'Workspace mismatch',
    subtitle: 'This verification link belongs to a different workspace.',
  },
  urlInvalid: {
    title: 'Invalid URL',
    subtitle: 'The domain URL is not valid. Please check your configuration.',
  },
  originInvalid: {
    title: 'Invalid origin',
    subtitle: 'The verification must be performed from the registered domain.',
  },
  originMismatch: {
    title: 'Origin mismatch',
    subtitle: 'This verification link must be opened from the registered domain.',
  },
  verificationFailed: {
    title: 'Verification failed',
    subtitle: 'Unable to verify domain ownership. Please try again.',
  },
  networkError: {
    title: 'Connection error',
    subtitle:
      'Unable to connect to the server. Please check your internet connection and try again.',
  },
  unknownError: {
    title: 'Something went wrong',
    subtitle: 'An unexpected error occurred during verification. Please try again.',
  },
} as const;
