/**
 * Copy for Recording - Recording Received Email
 */

export const copy = {
  preview: (recordingTitle: string) => `New recording received: ${recordingTitle}`,
  title: 'New recording received',
  body: [
    (duration: string, submittedAt: string) =>
      `A customer submitted a screen recording. Duration: ${duration}. Submitted on ${submittedAt}.`,
  ],
  cta: 'View recording',
} as const;
