/**
 * Copy for Project - Recovery Scheduled Email
 */

export const copy = {
  preview: (projectName: string) => `${projectName} recovery scheduled`,
  title: 'Project recovery scheduled',
  subtitle: (projectName: string) => `${projectName} is being recovered`,
  body: [
    'Your project is scheduled for recovery. All data including recordings, recording links, and project settings will be restored.',
    'You will receive a confirmation once the recovery is complete.',
  ],
} as const;
