/**
 * Highlight Links - Public Links Email
 * Educate users about public recording links
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';
import { copy } from '../../../copy/highlight/links/public-links';

export interface PublicLinksEmailProps {
  dashboardUrl?: string;
  docsUrl?: string;
}

export const PublicLinksEmail = ({
  dashboardUrl = 'https://app.userplane.io/links',
  docsUrl = 'https://docs.userplane.io/links/public',
}: PublicLinksEmailProps) => {
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

export default PublicLinksEmail;
