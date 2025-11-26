/**
 * Resend email client
 * Official Resend API integration
 */

import { Resend } from 'resend';
import { createAppLogger } from '@workspace/logger';
import type {
  EmailClient,
  EmailProvider,
  SendEmailParams,
  SendEmailOptions,
  SendEmailResponse,
} from '../types';

const logger = createAppLogger('resend-email');

export class ResendEmailClient implements EmailClient {
  private client: Resend;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Resend API key is required');
    }
    this.client = new Resend(apiKey);
  }

  async send(params: SendEmailParams, options?: SendEmailOptions): Promise<SendEmailResponse> {
    try {
      // Build Resend request
      const resendParams: any = {
        from: params.from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
      };

      // Add optional fields
      if (params.html) resendParams.html = params.html;
      if (params.text) resendParams.text = params.text;
      if (params.replyTo) {
        resendParams.reply_to = Array.isArray(params.replyTo) ? params.replyTo : [params.replyTo];
      }
      if (params.cc) {
        resendParams.cc = Array.isArray(params.cc) ? params.cc : [params.cc];
      }
      if (params.bcc) {
        resendParams.bcc = Array.isArray(params.bcc) ? params.bcc : [params.bcc];
      }
      if (params.tags) resendParams.tags = params.tags;

      // Add scheduling if specified
      if (options?.scheduledAt) {
        resendParams.scheduled_at = options.scheduledAt;
      }

      // Build Resend options
      const resendOptions: any = {};
      if (options?.idempotencyKey) {
        resendOptions.idempotencyKey = options.idempotencyKey;
      }

      // Send email via Resend
      const response = await this.client.emails.send(resendParams, resendOptions);

      logger.info(
        {
          emailId: response.data?.id,
          to: params.to,
          subject: params.subject,
          scheduled: !!options?.scheduledAt,
          idempotent: !!options?.idempotencyKey,
        },
        'Email sent via Resend'
      );

      return {
        id: response.data?.id || 'unknown',
      };
    } catch (error) {
      logger.error({ error, params }, 'Failed to send email via Resend');
      throw error;
    }
  }

  getProvider(): EmailProvider {
    return 'resend';
  }
}
