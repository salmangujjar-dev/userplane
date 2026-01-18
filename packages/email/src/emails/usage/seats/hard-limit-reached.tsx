/**
 * Usage Seats - Hard Limit Reached Email
 * Sent when a workspace has reached its seat limit
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../../copy/usage/seats/hard-limit-reached';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';

export interface SeatsHardLimitEmailProps {
  workspaceName?: string;
  totalSeats?: number;
  upgradeUrl?: string;
}

export const SeatsHardLimitEmail = ({
  workspaceName = 'My Workspace',
  totalSeats = 5,
  upgradeUrl = 'https://app.userplane.io/billing',
}: SeatsHardLimitEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(workspaceName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(totalSeats, workspaceName)}</Text>

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

export default SeatsHardLimitEmail;
