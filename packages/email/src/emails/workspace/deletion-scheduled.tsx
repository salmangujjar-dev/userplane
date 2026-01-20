/**
 * Workspace - Deletion Scheduled Email
 * Sent when a workspace is scheduled for deletion
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/workspace/deletion-scheduled';
import { getDeletionDate, getWorkspaceName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface DeletionScheduledEmailProps {
  workspaceName: string;
  deletionDate: string;
  cancelUrl: string;
}

export const DeletionScheduledEmail = ({
  workspaceName,
  deletionDate,
  cancelUrl,
}: DeletionScheduledEmailProps) => {
  const formattedWorkspaceName = getWorkspaceName(workspaceName);
  const formattedDeletionDate = getDeletionDate(deletionDate);

  return (
    <EmailLayout preview={copy.preview(formattedWorkspaceName, formattedDeletionDate)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>
        {copy.subtitle(formattedWorkspaceName, formattedDeletionDate)}
      </Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={cancelUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default DeletionScheduledEmail;
