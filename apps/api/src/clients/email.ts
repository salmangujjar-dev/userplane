/**
 * Email client initialization
 * Creates the configured email client based on environment settings
 */

import { createEmailClient, type EmailClient } from '@workspace/email';
import { env } from '@/api/env';

export const emailClient: EmailClient = createEmailClient({
  provider: env.email.provider,
  apiKey: env.email.resendApiKey,
  workingDirectory: process.cwd(),
});

export type { EmailClient } from '@workspace/email';
