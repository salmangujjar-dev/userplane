/**
 * Highlight Screenshots - Request Email
 * Educate users about screenshot capture capabilities
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';
import { copy } from '../../../copy/highlight/screenshots/request';

export interface RequestScreenshotEmailProps {
  dashboardUrl?: string;
  docsUrl?: string;
}

export const RequestScreenshotEmail = ({
  dashboardUrl = 'https://app.userplane.io/dashboard',
  docsUrl = 'https://docs.userplane.io/screenshots',
}: RequestScreenshotEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
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

export default RequestScreenshotEmail;
