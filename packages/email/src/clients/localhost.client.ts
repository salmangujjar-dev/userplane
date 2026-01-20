/**
 * Localhost email client
 * File-based email storage for development
 * Mimics Resend's API but writes to local files
 */

import { createAppLogger } from '@workspace/logger';
import { promises as fs } from 'fs';
import { join } from 'path';

import type {
  EmailClient,
  EmailProvider,
  SendBatchEmailResponse,
  SendEmailOptions,
  SendEmailParams,
  SendEmailResponse,
} from '../types';

const logger = createAppLogger('localhost-email');

interface EmailRecord {
  id: string;
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  tags?: Array<{ name: string; value: string }>;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  scheduledAt?: string;
  timestamp: string;
}

export class LocalhostEmailClient implements EmailClient {
  private inboxDir: string;
  private idempotencyCache: Map<string, string> = new Map();

  constructor(workingDirectory: string = process.cwd()) {
    this.inboxDir = join(workingDirectory, 'localhost', 'inbox');
  }

  async send(params: SendEmailParams, options?: SendEmailOptions): Promise<SendEmailResponse> {
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
          'Batch emails written to local inbox'
        );

        // Return all email IDs
        return {
          ids: emailIds,
        };
      }
    }

    // Handle idempotency - check if we've sent this email in the last 24h
    if (options?.idempotencyKey) {
      const cachedId = this.idempotencyCache.get(options.idempotencyKey);
      if (cachedId) {
        logger.debug(
          { idempotencyKey: options.idempotencyKey, emailId: cachedId },
          'Returning cached email ID (idempotency)'
        );
        return { ids: [cachedId] };
      }
    }

    // Generate email ID (mimics Resend's format)
    const emailId = this.generateEmailId();

    // Create email record
    const emailRecord: EmailRecord = {
      id: emailId,
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
      cc: params.cc,
      bcc: params.bcc,
      tags: params.tags,
      headers: params.headers,
      idempotencyKey: options?.idempotencyKey,
      scheduledAt: options?.scheduledAt,
      timestamp: new Date().toISOString(),
    };

    // Write to files
    await this.writeToInbox(emailRecord);

    // Cache idempotency key
    if (options?.idempotencyKey) {
      this.idempotencyCache.set(options.idempotencyKey, emailId);
      // Clear cache after 24 hours (mimics Resend's behavior)
      setTimeout(
        () => {
          this.idempotencyCache.delete(options.idempotencyKey!);
        },
        24 * 60 * 60 * 1000
      );
    }

    logger.info(
      {
        emailId,
        to: params.to,
        subject: params.subject,
        scheduled: !!options?.scheduledAt,
        idempotent: !!options?.idempotencyKey,
      },
      'Email written to local inbox'
    );

    // Return as array for consistency
    return { ids: [emailId] };
  }

  async sendBatch(
    emails: Array<SendEmailParams>,
    options?: Omit<SendEmailOptions, 'scheduledAt'>
  ): Promise<SendBatchEmailResponse> {
    if (emails.length === 0) {
      throw new Error('Batch send requires at least one email');
    }

    if (emails.length > 100) {
      throw new Error('Batch send supports up to 100 emails at once');
    }

    // Send all emails and collect IDs
    const results = await Promise.all(
      emails.map((params) =>
        this.send(params, {
          ...options,
          idempotencyKey: undefined,
        })
      )
    );

    logger.info(
      {
        emailIds: results.flatMap((r) => r.ids),
        count: emails.length,
      },
      'Batch emails written to local inbox'
    );

    return {
      data: results.flatMap((result) => result.ids.map((id) => ({ id }))),
    };
  }

  getProvider(): EmailProvider {
    return 'localhost';
  }

  /**
   * Write email to local inbox
   * Creates folder structure: inbox/<recipient>/<timestamp>/email.{html,txt,json}
   */
  private async writeToInbox(email: EmailRecord): Promise<void> {
    await fs.mkdir(this.inboxDir, { recursive: true });

    // Use timestamp as folder name (milliseconds since epoch)
    const timestamp = Date.now().toString();

    // Write to recipient-specific folders
    const recipients = Array.isArray(email.to) ? email.to : [email.to];
    for (const recipient of recipients) {
      // Create recipient inbox folder
      const recipientFolder = join(this.inboxDir, recipient);
      await fs.mkdir(recipientFolder, { recursive: true });

      // Create email folder with timestamp
      const emailFolder = join(recipientFolder, timestamp);
      await fs.mkdir(emailFolder, { recursive: true });

      // Write email.html
      if (email.html) {
        const htmlPath = join(emailFolder, 'email.html');
        await fs.writeFile(htmlPath, email.html, 'utf-8');
      }

      // Write email.txt
      if (email.text) {
        const txtPath = join(emailFolder, 'email.txt');
        await fs.writeFile(txtPath, email.text, 'utf-8');
      }

      // Write email.json with metadata (everything except html and text)
      const metadata = {
        id: email.id,
        from: email.from,
        to: email.to,
        subject: email.subject,
        replyTo: email.replyTo,
        cc: email.cc,
        bcc: email.bcc,
        tags: email.tags,
        headers: email.headers,
        idempotencyKey: email.idempotencyKey,
        scheduledAt: email.scheduledAt,
        timestamp: email.timestamp,
      };
      const jsonPath = join(emailFolder, 'email.json');
      await fs.writeFile(jsonPath, JSON.stringify(metadata, null, 2), 'utf-8');
    }

    // Also write to _all folder for easy access to all emails
    const allFolder = join(this.inboxDir, '_all');
    await fs.mkdir(allFolder, { recursive: true });
    const emailFolder = join(allFolder, timestamp);
    await fs.mkdir(emailFolder, { recursive: true });

    if (email.html) {
      await fs.writeFile(join(emailFolder, 'email.html'), email.html, 'utf-8');
    }
    if (email.text) {
      await fs.writeFile(join(emailFolder, 'email.txt'), email.text, 'utf-8');
    }

    const metadata = {
      id: email.id,
      from: email.from,
      to: email.to,
      subject: email.subject,
      replyTo: email.replyTo,
      cc: email.cc,
      bcc: email.bcc,
      tags: email.tags,
      headers: email.headers,
      idempotencyKey: email.idempotencyKey,
      scheduledAt: email.scheduledAt,
      timestamp: email.timestamp,
    };
    await fs.writeFile(join(emailFolder, 'email.json'), JSON.stringify(metadata, null, 2), 'utf-8');
  }

  /**
   * Generate email ID mimicking Resend's format
   */
  private generateEmailId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `local_${timestamp}_${random}`;
  }
}
