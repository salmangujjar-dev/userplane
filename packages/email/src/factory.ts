/**
 * Email client factory
 * Creates the appropriate email client based on configuration
 */

import { LocalhostEmailClient } from './clients/localhost.client';
import { ResendEmailClient } from './clients/resend.client';
import type { EmailClient, EmailClientConfig } from './types';

/**
 * Create email client based on provider configuration
 *
 * @example
 * // Localhost client for development
 * const client = createEmailClient({
 *   provider: 'localhost',
 *   workingDirectory: process.cwd(),
 * });
 *
 * @example
 * // Resend client for production
 * const client = createEmailClient({
 *   provider: 'resend',
 *   apiKey: process.env.RESEND_API_KEY,
 * });
 */
export function createEmailClient(config: EmailClientConfig): EmailClient {
  switch (config.provider) {
    case 'localhost':
      return new LocalhostEmailClient(config.workingDirectory);

    case 'resend':
      if (!config.apiKey) {
        throw new Error('Resend API key is required when using resend provider');
      }
      return new ResendEmailClient(config.apiKey);

    default:
      throw new Error(`Unknown email provider: ${config.provider}`);
  }
}
