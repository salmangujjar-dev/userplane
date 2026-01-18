/**
 * Resend email client
 * Official Resend API integration
 */

import { createAppLogger } from '@workspace/logger';
import type { CreateEmailOptions, CreateEmailRequestOptions } from 'resend';
import { Resend } from 'resend';

import type {
  EmailClient,
  EmailProvider,
  SendEmailOptions,
  SendEmailParams,
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
      // Build Resend request with proper typing
      // SendEmailParams union type guarantees at least one of html or text exists
      const contentFields = params.html
        ? ({ html: params.html, ...(params.text && { text: params.text }) } as const)
        : ({ text: params.text as string } as const);

      const resendParams: CreateEmailOptions = {
        from: params.from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        ...contentFields,
        ...(params.replyTo && {
          replyTo: Array.isArray(params.replyTo) ? params.replyTo : [params.replyTo],
        }),
        ...(params.cc && {
          cc: Array.isArray(params.cc) ? params.cc : [params.cc],
        }),
        ...(params.bcc && {
          bcc: Array.isArray(params.bcc) ? params.bcc : [params.bcc],
        }),
        ...(params.tags && { tags: params.tags }),
        ...(options?.scheduledAt && { scheduledAt: options.scheduledAt }),
      };

      // Build Resend options
      const resendOptions: CreateEmailRequestOptions = {
        ...(options?.idempotencyKey && { idempotencyKey: options.idempotencyKey }),
      };

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
