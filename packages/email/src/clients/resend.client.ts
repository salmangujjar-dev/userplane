/**
 * Resend email client
 * Official Resend API integration
 */

import { createServerLogger, type LogLevel } from '@workspace/common-logger';
import type { CreateEmailOptions, CreateEmailRequestOptions } from 'resend';
import { Resend } from 'resend';

import type {
  EmailClient,
  EmailProvider,
  SendBatchEmailResponse,
  SendEmailOptions,
  SendEmailParams,
  SendEmailResponse,
} from '../types';

const isDev = process.env.NODE_ENV !== 'production';
const logger = createServerLogger('resend-email', {
  level: (process.env.LOG_LEVEL as LogLevel) || (isDev ? 'debug' : 'info'),
  pretty: isDev,
});

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
      // Use batch send if batch is true and to has multiple recipients
      const recipients = Array.isArray(params.to) ? params.to : [params.to];
      if (params.batch && recipients.length > 1) {
        if (options?.scheduledAt) {
          logger.warn('scheduledAt is not supported in batch mode, falling back to regular send');
        } else {
          // Create batch emails with same content, different recipients
          const batchEmails = recipients.map((recipient) => ({
            ...params,
            to: recipient,
            batch: false,
          }));

          const batchResponse = await this.sendBatch(batchEmails, options);

          const emailIds = batchResponse.data.map((item) => item.id);

          logger.info(
            {
              emailIds,
              count: recipients.length,
              subject: params.subject,
            },
            'Batch emails sent via Resend'
          );

          // Return all email IDs
          return {
            ids: emailIds,
          };
        }
      }

      // Build Resend request with proper typing
      // SendEmailParams union type guarantees at least one of html or text exists
      const contentFields = params.html
        ? ({ html: params.html, ...(params.text && { text: params.text }) } as const)
        : ({ text: params.text as string } as const);

      const resendParams: CreateEmailOptions = {
        from: params.from,
        to: recipients,
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
        ...(params.headers && { headers: params.headers }),
        ...(options?.scheduledAt && { scheduledAt: options.scheduledAt }),
      };

      // Build Resend options
      const resendOptions: CreateEmailRequestOptions = {
        ...(options?.idempotencyKey && { idempotencyKey: options.idempotencyKey }),
      };

      // Send email via Resend
      const response = await this.client.emails.send(resendParams, resendOptions);

      const emailId = response.data?.id || 'unknown';

      logger.info(
        {
          emailId,
          to: params.to,
          subject: params.subject,
          scheduled: !!options?.scheduledAt,
          idempotent: !!options?.idempotencyKey,
        },
        'Email sent via Resend'
      );

      // Return as array for consistency
      return {
        ids: [emailId],
      };
    } catch (error) {
      logger.error({ error, params }, 'Failed to send email via Resend');
      throw error;
    }
  }

  async sendBatch(
    emails: Array<SendEmailParams>,
    options?: Omit<SendEmailOptions, 'scheduledAt'>
  ): Promise<SendBatchEmailResponse> {
    try {
      if (emails.length === 0) {
        throw new Error('Batch send requires at least one email');
      }

      if (emails.length > 100) {
        throw new Error('Batch send supports up to 100 emails at once');
      }

      // Transform emails to Resend format
      const resendEmails = emails.map((params) => {
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
          ...(params.headers && { headers: params.headers }),
        };

        return resendParams;
      });

      // Build Resend options
      const resendOptions: CreateEmailRequestOptions = {
        ...(options?.idempotencyKey && { idempotencyKey: options.idempotencyKey }),
      };

      // Send batch via Resend
      const response = await this.client.batch.send(resendEmails, resendOptions);

      if (!response.data) {
        throw new Error(
          `Failed to send batch emails: ${response.error?.message || 'Unknown error'}`
        );
      }

      logger.info(
        {
          emailIds: response.data.data.map((item) => item.id),
          count: emails.length,
          idempotent: !!options?.idempotencyKey,
        },
        'Batch emails sent via Resend'
      );

      return {
        data: response.data.data,
      };
    } catch (error) {
      logger.error({ error, emailCount: emails.length }, 'Failed to send batch emails via Resend');
      throw error;
    }
  }

  getProvider(): EmailProvider {
    return 'resend';
  }
}
