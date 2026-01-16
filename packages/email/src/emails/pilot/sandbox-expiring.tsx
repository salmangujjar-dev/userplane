/**
 * Pilot Sandbox Expiring Email
 * Sent when a user's sandbox trial is about to expire
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';
import { copy } from '../../copy/pilot/sandbox-expiring';

export interface SandboxExpiringEmailProps {
  dashboardUrl?: string;
  upgradeUrl?: string;
  expiresInDays?: number;
}

export const SandboxExpiringEmail = ({
  dashboardUrl = 'https://app.userplane.io/dashboard',
  upgradeUrl = 'https://app.userplane.io/billing',
  expiresInDays = 3,
}: SandboxExpiringEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(expiresInDays)}>
      <Text style={styles.title}>{copy.title(expiresInDays)}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={upgradeUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>
          Or{' '}
          <Link href={dashboardUrl} style={styles.link}>
            {copy.secondaryText}
          </Link>{' '}
          until it expires.
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default SandboxExpiringEmail;
