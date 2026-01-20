/**
 * Billing - Subscription Active Email
 * Sent when a subscription is activated
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/billing/subscription-active';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface SubscriptionActiveEmailProps {
  planName: string;
  dashboardUrl: string;
  billingUrl: string;
}

export const SubscriptionActiveEmail = ({
  planName,
  dashboardUrl,
  billingUrl,
}: SubscriptionActiveEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(planName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(planName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](planName)}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={dashboardUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>
          <Link href={billingUrl} style={styles.link}>
            {copy.helpText}
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default SubscriptionActiveEmail;
