/**
 * Post-recording screen copy
 * Text for review, upload, success, and error screens
 */

export const POST_RECORDING_REVIEW_COPY = {
  title: 'Review your recording',
  subtitle: 'Make sure everything looks good before submitting',
  submitButton: 'Submit recording',
  startOverLink: 'Start over',
} as const;

export const POST_RECORDING_UPLOAD_COPY = {
  title: 'Uploading your recording',
  subtitle: 'This may take a moment',
} as const;

export const POST_RECORDING_ACK_COPY = {
  title: 'All done!',
  subtitle: 'Your recording has been submitted successfully',
  closeInfo: 'This window will close automatically',
} as const;

export const POST_RECORDING_ERROR_COPY = {
  startOverButton: 'Start over',
} as const;
