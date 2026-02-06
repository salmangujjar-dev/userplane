/**
 * Billing - Subscription Reverse Trial Email
 * Sent when a user enters a paid reverse trial period
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/billing/subscription-reverse-trial';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface SubscriptionReverseTrialEmailProps {
  planName: string;
  trialDays: number;
  dashboardUrl: string;
  logoUrl?: string;
}

export const SubscriptionReverseTrialEmail = ({
  planName,
  trialDays,
  dashboardUrl,
  logoUrl,
}: SubscriptionReverseTrialEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(planName, trialDays)} logoUrl={logoUrl}>
      <Text style={styles.title}>{copy.title(planName)}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(trialDays)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](planName, trialDays)}</Text>
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

export default SubscriptionReverseTrialEmail;
