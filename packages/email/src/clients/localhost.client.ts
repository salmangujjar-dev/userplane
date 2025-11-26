/**
 * Localhost email client
 * File-based email storage for development
 * Mimics Resend's API but writes to local files
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { createAppLogger } from '@workspace/logger';
import type {
  EmailClient,
  EmailProvider,
  SendEmailParams,
  SendEmailOptions,
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
    // Handle idempotency - check if we've sent this email in the last 24h
    if (options?.idempotencyKey) {
      const cachedId = this.idempotencyCache.get(options.idempotencyKey);
      if (cachedId) {
        logger.debug(
          { idempotencyKey: options.idempotencyKey, emailId: cachedId },
          'Returning cached email ID (idempotency)'
        );
        return { id: cachedId };
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

    return { id: emailId };
  }

  getProvider(): EmailProvider {
    return 'localhost';
  }

  /**
   * Write email to local inbox
   * Creates separate files per recipient and a master log
   */
  private async writeToInbox(email: EmailRecord): Promise<void> {
    await fs.mkdir(this.inboxDir, { recursive: true });

    // Write to recipient-specific files
    const recipients = Array.isArray(email.to) ? email.to : [email.to];
    for (const recipient of recipients) {
      const recipientFile = join(this.inboxDir, `${recipient}.ndjson`);
      const line = JSON.stringify(email) + '\n';
      await fs.appendFile(recipientFile, line);
    }

    // Write to master log
    const masterLog = join(this.inboxDir, '_all.ndjson');
    const line = JSON.stringify(email) + '\n';
    await fs.appendFile(masterLog, line);
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
