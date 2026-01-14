/**
 * Email template rendering functions
 * Server-safe functions to render React Email templates
 */

import React from 'react';
import { renderEmail, renderEmailText } from './render';

// Template types
export type { WorkspaceInviteEmailProps } from './templates/workspace-invite';
export type { EmailVerificationProps } from './templates/email-verification';
export type { MagicLinkEmailProps } from './templates/magic-link';

// Dynamic imports to avoid JSX parsing issues
const WorkspaceInviteEmailImport = import('./templates/workspace-invite');
const EmailVerificationEmailImport = import('./templates/email-verification');
const MagicLinkEmailImport = import('./templates/magic-link');

export interface RenderWorkspaceInviteParams {
  workspaceName: string;
  inviterName: string;
  inviteUrl: string;
}

export interface RenderEmailVerificationParams {
  userName: string;
  verificationUrl: string;
}

export interface RenderMagicLinkParams {
  magicLinkUrl: string;
}

/**
 * Render workspace invite email to HTML
 */
export async function renderWorkspaceInvite(props: RenderWorkspaceInviteParams): Promise<string> {
  const { WorkspaceInviteEmail } = await WorkspaceInviteEmailImport;

  const html = await renderEmail(React.createElement(WorkspaceInviteEmail, props));

  return html;
}

/**
 * Render workspace invite email to plain text
 */
export async function renderWorkspaceInviteText(
  props: RenderWorkspaceInviteParams
): Promise<string> {
  const { WorkspaceInviteEmail } = await WorkspaceInviteEmailImport;

  const text = await renderEmailText(React.createElement(WorkspaceInviteEmail, props));

  return text;
}

/**
 * Render email verification email to HTML
 */
export async function renderEmailVerification(
  props: RenderEmailVerificationParams
): Promise<string> {
  const { EmailVerificationEmail } = await EmailVerificationEmailImport;

  const html = await renderEmail(React.createElement(EmailVerificationEmail, props));

  return html;
}

/**
 * Render email verification email to plain text
 */
export async function renderEmailVerificationText(
  props: RenderEmailVerificationParams
): Promise<string> {
  const { EmailVerificationEmail } = await EmailVerificationEmailImport;

  const text = await renderEmailText(React.createElement(EmailVerificationEmail, props));

  return text;
}

/**
 * Render magic link email to HTML
 */
export async function renderMagicLink(props: RenderMagicLinkParams): Promise<string> {
  const { MagicLinkEmail } = await MagicLinkEmailImport;

  const html = await renderEmail(React.createElement(MagicLinkEmail, props));

  return html;
}

/**
 * Render magic link email to plain text
 */
export async function renderMagicLinkText(props: RenderMagicLinkParams): Promise<string> {
  const { MagicLinkEmail } = await MagicLinkEmailImport;

  const text = await renderEmailText(React.createElement(MagicLinkEmail, props));

  return text;
}
