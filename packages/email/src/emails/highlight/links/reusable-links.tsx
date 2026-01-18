/**
 * Highlight Links - Reusable Links Email
 * Educate users about reusable recording links
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../../copy/highlight/links/reusable-links';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';

export interface ReusableLinksEmailProps {
  dashboardUrl?: string;
  docsUrl?: string;
}

export const ReusableLinksEmail = ({
  dashboardUrl = 'https://app.userplane.io/links',
  docsUrl = 'https://docs.userplane.io/links/reusable',
}: ReusableLinksEmailProps) => {
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

export default ReusableLinksEmail;
