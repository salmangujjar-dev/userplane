/**
 * Workspace - Recovery Scheduled Email
 * Sent when a workspace deletion is cancelled and recovery is scheduled
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/workspace/recovery-scheduled';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface RecoveryScheduledEmailProps {
  workspaceName?: string;
  dashboardUrl?: string;
}

export const RecoveryScheduledEmail = ({
  workspaceName = 'My Workspace',
  dashboardUrl = 'https://app.userplane.io/dashboard',
}: RecoveryScheduledEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(workspaceName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(workspaceName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](workspaceName)}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={dashboardUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default RecoveryScheduledEmail;
