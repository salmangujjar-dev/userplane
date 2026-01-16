/**
 * Highlight Links - Embedded Links Email
 * Educate users about embedding recording links in their app
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';
import { copy } from '../../../copy/highlight/links/embedded';

export interface EmbeddedLinksEmailProps {
  docsUrl?: string;
  dashboardUrl?: string;
}

export const EmbeddedLinksEmail = ({
  docsUrl = 'https://docs.userplane.io/links/embedded',
  dashboardUrl = 'https://app.userplane.io/links',
}: EmbeddedLinksEmailProps) => {
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

export default EmbeddedLinksEmail;
