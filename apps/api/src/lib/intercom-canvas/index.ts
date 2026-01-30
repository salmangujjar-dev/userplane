/**
 * Intercom Canvas Kit
 *
 * Re-exports all canvas builder functions, URL utilities, and helpers
 * for the Intercom Canvas Kit integration.
 */

// Canvas builders
export { type AccessRequestedCanvasOptions, buildAccessRequestedCanvas } from './access-requested';
export {
  buildConnectIntegrationCanvas,
  type ConnectIntegrationCanvasOptions,
} from './connect-integration';
export {
  buildCanvasErrorCanvas,
  buildErrorCanvas,
  buildIntegrationNotFoundCanvas,
  type ErrorCanvasOptions,
} from './error';
export { buildLimitExceededCanvas, type LimitExceededCanvasOptions } from './limit-exceeded';
export {
  buildLinkCreatorCanvas,
  DEFAULT_RECORDING_MESSAGE,
  type DomainOption,
  generateDefaultRecordingMessage,
  type LinkCreatorCanvasOptions,
  type ProjectOption,
} from './link-creator';
export { buildOpenerCanvas, type OpenerCanvasOptions } from './opener';
export {
  buildRecordingCanvas,
  DEFAULT_RECORDING_FOOTER,
  type RecordingCanvasOptions,
} from './recording';
export { buildSignUpCanvas, type SignUpCanvasOptions } from './signup';
export { buildSuccessCanvas, type SuccessCanvasOptions } from './success';

// URL utilities
export { type IntercomCanvasUrls, intercomCanvasUrls } from './urls';

// Intercom utilities
export {
  buildIntercomConversationRef,
  buildIntercomConversationTitle,
  buildIntercomConversationUrl,
  ConfigureComponentId,
  extractLinkCreatorFormValues,
  FormFieldId,
  generateRecordingRequestMessage,
  generateRecordingRequestMessageForInbox,
  getTeammateDisplayName,
  InboxComponentId,
  type IntercomConversationRef,
  type LinkCreatorFormValues,
  resolveRecordingMessage,
} from './utils';
