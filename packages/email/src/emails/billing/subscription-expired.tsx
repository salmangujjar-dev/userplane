/**
 * Billing - Subscription Expired Email
 * Sent when a subscription expires
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';
import { copy } from '../../copy/billing/subscription-expired';

export interface SubscriptionExpiredEmailProps {
  planName?: string;
  renewUrl?: string;
}

export const SubscriptionExpiredEmail = ({
  planName = 'Starter',
  renewUrl = 'https://app.userplane.io/billing',
}: SubscriptionExpiredEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(planName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={renewUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default SubscriptionExpiredEmail;
