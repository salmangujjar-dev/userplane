/**
 * Copy for Auth - Access Request Email
 */

export const copy = {
  preview: (requesterName: string, workspaceName: string) =>
    `${requesterName} requested to join ${workspaceName}`,
  title: 'Access request',
  body: [
    (requesterName: string, requesterEmail: string, workspaceName: string) =>
      `${requesterName} (${requesterEmail}) has requested to join ${workspaceName}.`,
    'As a workspace owner, you can review this request and approve or decline it.',
  ],
  cta: 'Review request',
  footer:
    'This request will expire in 7 days. If you do not recognize this request, you can safely decline it.',
} as const;
