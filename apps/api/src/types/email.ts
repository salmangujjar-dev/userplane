/**
 * Email service types
 * Email sending and template types
 */

/**
 * Workspace invitation email parameters
 */
export interface WorkspaceInviteEmailParams {
  to: string;
  workspaceName: string;
  inviteUrl: string;
  inviterName: string;
  inviterEmail: string;
}

/**
 * Email body structure
 */
export interface EmailBody {
  to: string;
  from: string;
  subject: string;
  html: string;
  timestamp: string;
}

/**
 * Email provider type
 */
export type EmailProvider = 'localhost' | 'resend' | 'sendgrid';
