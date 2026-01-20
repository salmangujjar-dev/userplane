/**
 * Copy for Offboarding - Account Deletion Verification Email
 * Sent when a user requests to delete their account
 * Requires clicking the verification link to confirm deletion
 */

export const copy = {
  preview: 'Confirm your Userplane account deletion',
  title: 'Confirm account deletion',
  body: [
    'We received a request to delete your Userplane account.',
    'This action is permanent and cannot be undone. All associated data, including recordings, recording links, and workspace settings will be permanently deleted.',
  ],
  cta: 'Delete my account',
  footer:
    "If you didn't request this, you can safely ignore this email. Your account will remain active.",
} as const;
