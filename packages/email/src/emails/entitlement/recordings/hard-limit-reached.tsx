/**
 * Entitlement Recordings - Hard Limit Reached Email
 * Sent when a workspace has reached its recording limit
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';
import { copy } from '../../../copy/entitlement/recordings/hard-limit-reached';

export interface RecordingsHardLimitEmailProps {
  workspaceName?: string;
  totalMinutes?: number;
  upgradeUrl?: string;
}

export const RecordingsHardLimitEmail = ({
  workspaceName = 'My Workspace',
  totalMinutes = 30,
  upgradeUrl = 'https://app.userplane.io/billing',
}: RecordingsHardLimitEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(workspaceName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(totalMinutes)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={upgradeUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default RecordingsHardLimitEmail;
