/**
 * Highlight Screenshots - Request Custom Metadata Email
 * Educate users about attaching metadata to screenshots
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';
import { copy } from '../../../copy/highlight/screenshots/request-custom-metadata';

export interface ScreenshotCustomMetadataEmailProps {
  docsUrl?: string;
}

export const ScreenshotCustomMetadataEmail = ({
  docsUrl = 'https://docs.userplane.io/screenshots/metadata',
}: ScreenshotCustomMetadataEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={docsUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default ScreenshotCustomMetadataEmail;
