/**
 * Copy for Workspace - Access Request Email
 */

export const copy = {
  preview: (requesterName: string, workspaceName: string) =>
    `${requesterName} requested to join ${workspaceName}`,
  title: 'Access request',
  body: [
    (requesterName: string, workspaceName: string) =>
      `${requesterName} has requested access to ${workspaceName}`,
  ],
  cta: 'Review request',
  footer: (expiryDate: string) =>
    `This request will expire on ${expiryDate}. If you do not recognize this request, you can safely decline it.`,
} as const;
