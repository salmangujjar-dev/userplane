/**
 * Highlight Links - Customer Triggered Links Email
 * Educate users about customer-initiated recording links
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';
import { copy } from '../../../copy/highlight/links/customer-triggered-links';

export interface CustomerTriggeredLinksEmailProps {
  learnMoreUrl?: string;
  dashboardUrl?: string;
}

export const CustomerTriggeredLinksEmail = ({
  learnMoreUrl = 'https://docs.userplane.io/links/customer-triggered',
  dashboardUrl = 'https://app.userplane.io/links',
}: CustomerTriggeredLinksEmailProps) => {
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
          <Link href={learnMoreUrl} style={styles.link}>
            {copy.helpText}
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default CustomerTriggeredLinksEmail;
