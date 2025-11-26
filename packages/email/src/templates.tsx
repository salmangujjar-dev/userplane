/**
 * Email template rendering functions
 * Server-safe functions to render React Email templates
 */

import React from 'react';
import { renderEmail, renderEmailText } from './render';

// Template types
export type { WorkspaceInviteEmailProps } from './templates/workspace-invite';

// Dynamic imports to avoid JSX parsing issues
const WorkspaceInviteEmailImport = import('./templates/workspace-invite');

export interface RenderWorkspaceInviteParams {
  workspaceName: string;
  inviterName: string;
  inviteUrl: string;
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
