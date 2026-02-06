/**
 * Billing - Subscription Inactive Email
 * Sent when a subscription becomes inactive (paused or cancelled)
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/billing/subscription-inactive';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface SubscriptionInactiveEmailProps {
  planName: string;
  reactivateUrl: string;
  logoUrl?: string;
}

export const SubscriptionInactiveEmail = ({
  planName,
  reactivateUrl,
  logoUrl,
}: SubscriptionInactiveEmailProps) => {
  return (
    <EmailLayout preview={copy.preview} logoUrl={logoUrl}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(planName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={reactivateUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default SubscriptionInactiveEmail;
