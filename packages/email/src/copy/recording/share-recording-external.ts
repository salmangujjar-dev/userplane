/**
 * Copy for Recording - Share Recording External Email
 */

export const copy = {
  preview: (senderName: string) => `${senderName} shared a recording with you`,
  title: 'A recording was shared with you',
  subtitle: (senderName: string) => `${senderName} shared a recording with you on Userplane`,
  body: [
    'A customer recording has been shared with you. Join your team with the link below and get started with Userplane.',
  ],
  cta: 'Join workspace',
  secondaryCta: 'View recording',
} as const;
