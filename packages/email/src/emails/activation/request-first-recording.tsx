/**
 * Activation - Request First Recording Email
 * Nudge to get users to request their first screen recording
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';
import { copy } from '../../copy/activation/request-first-recording';

export interface RequestFirstRecordingEmailProps {
  createLinkUrl?: string;
  docsUrl?: string;
}

export const RequestFirstRecordingEmail = ({
  createLinkUrl = 'https://app.userplane.io/links/new',
  docsUrl = 'https://docs.userplane.io/getting-started',
}: RequestFirstRecordingEmailProps) => {
  return (
    <EmailLayout preview={copy.preview} ps={copy.ps}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={createLinkUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>
          Need help?{' '}
          <Link href={docsUrl} style={styles.link}>
            {copy.helpText}
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default RequestFirstRecordingEmail;
