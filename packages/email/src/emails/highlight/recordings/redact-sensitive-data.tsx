/**
 * Highlight Recordings - Redact Sensitive Data Email
 * Educate users about auto-blur and redaction features
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';
import { copy } from '../../../copy/highlight/recordings/redact-sensitive-data';

export interface RedactSensitiveDataEmailProps {
  settingsUrl?: string;
  docsUrl?: string;
}

export const RedactSensitiveDataEmail = ({
  settingsUrl = 'https://app.userplane.io/settings/privacy',
  docsUrl = 'https://docs.userplane.io/privacy/redaction',
}: RedactSensitiveDataEmailProps) => {
  return (
    <EmailLayout preview={copy.preview} ps={copy.ps}>
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
    </EmailLayout>
  );
};

export default RedactSensitiveDataEmail;
