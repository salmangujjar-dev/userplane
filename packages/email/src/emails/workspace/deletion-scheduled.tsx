/**
 * Workspace - Deletion Scheduled Email
 * Sent when a workspace is scheduled for deletion
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/workspace/deletion-scheduled';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface DeletionScheduledEmailProps {
  workspaceName?: string;
  deletionDate?: string;
  cancelUrl?: string;
}

export const DeletionScheduledEmail = ({
  workspaceName = 'My Workspace',
  deletionDate = 'January 30, 2025',
  cancelUrl = 'https://app.userplane.io/settings/workspace',
}: DeletionScheduledEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(workspaceName, deletionDate)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(workspaceName, deletionDate)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](deletionDate)}</Text>
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
