/**
 * Entitlement Seats - Soft Limit Reached Email
 * Sent when a workspace is approaching its seat limit
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../../copy/entitlement/seats/soft-limit-reached';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';

export interface SeatsSoftLimitEmailProps {
  workspaceName?: string;
  usedSeats?: number;
  totalSeats?: number;
  upgradeUrl?: string;
}

export const SeatsSoftLimitEmail = ({
  workspaceName = 'My Workspace',
  usedSeats = 4,
  totalSeats = 5,
  upgradeUrl = 'https://app.userplane.io/billing',
}: SeatsSoftLimitEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(workspaceName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(usedSeats, totalSeats, workspaceName)}</Text>

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

export default SeatsSoftLimitEmail;
