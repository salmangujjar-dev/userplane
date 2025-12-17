/**
 * Pre-recording screen copy
 * Text for setup, countdown, and pre-recording error screens
 */

export const PRE_RECORDING_COPY = {
  title: 'Record your screen',
  subtitle: (requesterName: string) => `${requesterName} has requested a screen recording from you`,
  screenVoiceLabel: 'Screen + Voice',
  screenOnlyLabel: 'Screen only',
  startButton: 'Start recording',
} as const;

export const PRE_RECORDING_ERROR_COPY = {
  retryButton: 'Try again',
  requestLinkButton: 'Request a new link',
  requestMessage: "Hi, I need a new recording link. The previous one isn't working.",
} as const;
