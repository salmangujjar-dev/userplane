/**
 * Email client types
 * Consistent interface for all email providers (localhost, resend, etc.)
 */

/**
 * Email provider type
 */
export type EmailProvider = 'localhost' | 'resend';

/**
 * Email send parameters
 * Based on Resend's API format
 */
export interface SendEmailParams {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Email send options
 * Support for Resend features like idempotency and scheduling
 */
export interface SendEmailOptions {
  /**
   * Idempotency key to prevent duplicate sends
   * Up to 256 characters, kept for 24 hours
   * Format recommendation: <event-type>/<entity-id>
   */
  idempotencyKey?: string;

  /**
   * Schedule email for future delivery
   * ISO 8601 format: "2024-08-05T11:52:01.858Z"
   */
  scheduledAt?: string;
}

/**
 * Email send response
 */
export interface SendEmailResponse {
  id: string;
}

/**
 * Email client configuration
 */
export interface EmailClientConfig {
  provider: EmailProvider;
  apiKey?: string;
  workingDirectory?: string;
}

/**
 * Email client interface
 * All providers must implement this interface
 */
export interface EmailClient {
  /**
   * Send a single email
   */
  send(params: SendEmailParams, options?: SendEmailOptions): Promise<SendEmailResponse>;

  /**
   * Get provider name
   */
  getProvider(): EmailProvider;
}
