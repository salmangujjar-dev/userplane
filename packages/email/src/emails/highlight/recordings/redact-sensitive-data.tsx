/**
 * Highlight Recordings - Redact Sensitive Data Email
 * Educate users about auto-blur and redaction features
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../../copy/highlight/recordings/redact-sensitive-data';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';

export interface RedactSensitiveDataEmailProps {
  settingsUrl?: string;
  docsUrl?: string;
}

export const RedactSensitiveDataEmail = ({
  settingsUrl = 'https://app.userplane.io/settings/privacy',
  docsUrl = 'https://docs.userplane.io/privacy/redaction',
}: RedactSensitiveDataEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={settingsUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>
          <Link href={docsUrl} style={styles.link}>
            {copy.helpText}
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default RedactSensitiveDataEmail;
