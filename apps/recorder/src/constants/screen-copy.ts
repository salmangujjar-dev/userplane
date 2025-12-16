/**
 * Screen copy constants
 * User-facing text for recording screens
 */

export const DEFAULT_REQUESTER_NAME = 'Someone';

export const PRE_RECORDING_COPY = {
  title: 'Record your screen',
  subtitle: (requesterName: string) => `${requesterName} has requested a screen recording from you`,
  screenVoiceLabel: 'Screen + Voice',
  screenOnlyLabel: 'Screen only',
  startButton: 'Start recording',
};

export const RECORDING_IN_PROGRESS_COPY = {
  title: 'Recording in progress',
  subtitle: "Click stop when you're done",
  stopButton: 'Stop recording',
};

export const POST_RECORDING_REVIEW_COPY = {
  title: 'Review your recording',
  subtitle: 'Make sure everything looks good before submitting',
  submitButton: 'Submit recording',
  startOverLink: 'Start over',
};

export const POST_RECORDING_UPLOAD_COPY = {
  title: 'Uploading your recording',
  subtitle: 'This may take a moment',
};

export const POST_RECORDING_ACK_COPY = {
  title: 'All done!',
  subtitle: 'Your recording has been submitted successfully',
  closeInfo: 'This window will close automatically',
};

export const PRE_RECORDING_ERROR_COPY = {
  retryButton: 'Try again',
  requestLinkButton: 'Request a new link',
  requestMessage: "Hi, I need a new recording link. The previous one isn't working.",
};

export const POST_RECORDING_ERROR_COPY = {
  startOverButton: 'Start over',
};
