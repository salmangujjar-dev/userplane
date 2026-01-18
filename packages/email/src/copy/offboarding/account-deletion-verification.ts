/**
 * Copy for Offboarding - Account Deletion Verification Email
 * Sent when a user requests to delete their account
 * Requires clicking the verification link to confirm deletion
 */

const formatGreeting = (userName: string) => {
  const trimmedName = userName?.trim();
  return trimmedName ? `Hi ${trimmedName},` : 'Hi there,';
};

export const copy = {
  preview: 'Confirm your Userplane account deletion',
  title: 'Confirm account deletion',
  greeting: (userName: string) => formatGreeting(userName),
  body: [
    'We received a request to delete your Userplane account. Click the button below to confirm.',
    'This action is permanent and cannot be undone. All associated data, including recordings, recording links, and workspace settings will be permanently deleted.',
  ],
  cta: 'Delete my account',
  footer:
    "If you didn't request this, you can safely ignore this email. Your account will remain active.",
} as const;
