/**
 * @workspace/email
 * Unified email package with clients and React Email templates
 * Supports localhost (file-based) and Resend
 */

// Email clients
export { createEmailClient } from './factory';
export { LocalhostEmailClient } from './clients/localhost.client';
export { ResendEmailClient } from './clients/resend.client';

export type {
  EmailClient,
  EmailProvider,
  SendEmailParams,
  SendEmailOptions,
  SendEmailResponse,
  EmailClientConfig,
} from './types';

// Email templates (server-safe exports)
export {
  renderWorkspaceInvite,
  renderWorkspaceInviteText,
  renderEmailVerification,
  renderEmailVerificationText,
  renderMagicLink,
  renderMagicLinkText,
} from './templates.js';
export type {
  WorkspaceInviteEmailProps,
  RenderWorkspaceInviteParams,
  EmailVerificationProps,
  RenderEmailVerificationParams,
  MagicLinkEmailProps,
  RenderMagicLinkParams,
} from './templates.js';
