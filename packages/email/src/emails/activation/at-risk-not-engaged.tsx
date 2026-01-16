/**
 * Activation - At Risk Not Engaged Email
 * Sent to users who signed up but haven't engaged with the product
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';
import { copy } from '../../copy/activation/at-risk-not-engaged';

export interface AtRiskNotEngagedEmailProps {
  dashboardUrl?: string;
  calendarUrl?: string;
}

export const AtRiskNotEngagedEmail = ({
  dashboardUrl = 'https://app.userplane.io/dashboard',
  calendarUrl = 'https://cal.com/userplane/help',
}: AtRiskNotEngagedEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={calendarUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>
          Or{' '}
          <Link href={dashboardUrl} style={styles.link}>
            {copy.secondaryText}
          </Link>{' '}
          and create your first recording link.
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default AtRiskNotEngagedEmail;
