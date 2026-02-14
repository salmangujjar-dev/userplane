/**
 * NotificationService - Preference-gated email dispatch
 *
 * Wraps EmailService for emails that respect workspace member notification preferences.
 * Only gates emails whose recipients are always workspace members:
 * - sendSafeRecordingReceived (creator = member, gated on notifyIncomingEvents)
 * - sendSafeAccessRequest (owners = members, gated on notifyAdminEvents)
 *
 * Single DB query per dispatch: given the input emails + preference column,
 * returns only the emails that are active members with the preference enabled.
 */

import { createLogger } from '@/api/lib/logger';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { EmailService } from '@/api/services/email.service';
import type {
  AccessRequestEmailParams,
  ReceipientEmailParams,
  RecordingReceivedEmailParams,
} from '@/api/types';

const logger = createLogger('notification-service');

type PreferenceKey = 'notifyIncomingEvents' | 'notifyAdminEvents';

export interface NotificationServiceDeps {
  emailService: EmailService;
  memberRepo: WorkspaceMemberRepository;
}

export class NotificationService {
  constructor(private deps: NotificationServiceDeps) {}

  /**
   * Single DB query: returns only the input emails that belong to active
   * members with the given preference enabled. Recipients of these emails
   * are always workspace members, so the result is the final list.
   */
  private async filterRecipientsByPreference(
    workspaceId: string,
    emails: string[],
    preferenceKey: PreferenceKey
  ): Promise<string[]> {
    const optedIn = await this.deps.memberRepo.findMembersWithPreferenceEnabled(
      workspaceId,
      emails,
      preferenceKey
    );

    const filtered = emails.filter((email) => optedIn.has(email.toLowerCase()));

    const removedCount = emails.length - filtered.length;
    if (removedCount > 0) {
      logger.debug(
        { workspaceId, preferenceKey, removedCount, totalRecipients: emails.length },
        'Filtered recipients by notification preference'
      );
    }

    return filtered;
  }

  /**
   * Send recording received email, gated on notifyIncomingEvents preference
   */
  async sendSafeRecordingReceived(
    workspaceId: string,
    receipientParams: ReceipientEmailParams,
    emailContentParams: RecordingReceivedEmailParams
  ): Promise<void> {
    const emails = normalizeRecipients(receipientParams.to);
    const filtered = await this.filterRecipientsByPreference(
      workspaceId,
      emails,
      'notifyIncomingEvents'
    );

    if (filtered.length === 0) return;

    await this.deps.emailService.sendSafeRecordingReceived(
      { ...receipientParams, to: filtered },
      emailContentParams
    );
  }

  /**
   * Send access request email, gated on notifyAdminEvents preference
   */
  async sendSafeAccessRequest(
    workspaceId: string,
    receipientParams: ReceipientEmailParams,
    emailContentParams: AccessRequestEmailParams
  ): Promise<void> {
    const emails = normalizeRecipients(receipientParams.to);
    const filtered = await this.filterRecipientsByPreference(
      workspaceId,
      emails,
      'notifyAdminEvents'
    );

    if (filtered.length === 0) return;

    await this.deps.emailService.sendSafeAccessRequest(
      { ...receipientParams, to: filtered },
      emailContentParams
    );
  }
}

function normalizeRecipients(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to];
}
