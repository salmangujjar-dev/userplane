/**
 * Entitlement Recordings - Soft Limit Reached Email
 * Sent when a workspace is approaching its recording limit
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';
import { copy } from '../../../copy/entitlement/recordings/soft-limit-reached';

export interface RecordingsSoftLimitEmailProps {
  workspaceName?: string;
  usedMinutes?: number;
  totalMinutes?: number;
  upgradeUrl?: string;
}

export const RecordingsSoftLimitEmail = ({
  workspaceName = 'My Workspace',
  usedMinutes = 25,
  totalMinutes = 30,
  upgradeUrl = 'https://app.userplane.io/billing',
}: RecordingsSoftLimitEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(workspaceName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(usedMinutes, totalMinutes)}</Text>

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

export default RecordingsSoftLimitEmail;
