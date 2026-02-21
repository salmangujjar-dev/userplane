/**
 * Copy for Recording - Share Recording Member Email
 */

export const copy = {
  preview: (senderName: string) => `${senderName} shared a recording with you`,
  title: 'A recording was shared with you',
  subtitle: (senderName: string) => `${senderName} shared a recording with you on Userplane`,
  body: ['A customer recording has been shared with you. Check it out with the link below.'],
  cta: 'View recording',
  fallbackText: 'Or copy this link',
} as const;
