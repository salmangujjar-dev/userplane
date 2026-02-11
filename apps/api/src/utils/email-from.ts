/**
 * Private utility for generating email "from" field
 * Encapsulates the logic for determining the sender based on email type
 */

import { env } from '@/api/env';

/**
 * Generate "from" field for auth emails
 * Uses auth inbox for authentication-related communications
 */
export function authFrom(): string {
  return `Userplane <${env.email.inboxes.auth}>`;
}

/**
 * Generate "from" field for notification emails
 * Uses notification inbox for general system notifications
 */
export function notificationFrom(): string {
  return `Userplane <${env.email.inboxes.notification}>`;
}

/**
 * Generate "from" field for invite emails
 * Uses invite inbox with workspace branding for invitations
 */
export function inviteFrom(workspaceName: string): string {
  return `${workspaceName} (via Userplane) <${env.email.inboxes.invite}>`;
}

/**
 * Generate "from" field for domain setup emails
 * Uses invite inbox for domain configuration communications
 */
export function domainFrom(): string {
  return `Userplane <${env.email.inboxes.invite}>`;
}
