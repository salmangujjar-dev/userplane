/**
 * Copy for Pilot Sandbox Expiring Email
 */

export const copy = {
  preview: (expiresInDays: number) => `Your Userplane sandbox expires in ${expiresInDays} days`,
  title: (expiresInDays: number) => `Sandbox expires in ${expiresInDays} days`,
  subtitle: 'Keep your recordings and workspace settings',
  body: [
    'Your Userplane sandbox will expire soon. Upgrade to keep your recordings, recording links, and workspace configuration.',
    'If you choose not to upgrade, your data will be deleted after expiration.',
  ],
  cta: 'Upgrade now',
  secondaryText: 'continue using your sandbox',
} as const;
