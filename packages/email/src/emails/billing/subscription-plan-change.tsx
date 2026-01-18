/**
 * Billing - Subscription Plan Change Email
 * Sent when a user upgrades or downgrades their plan
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/billing/subscription-plan-change';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface SubscriptionPlanChangeEmailProps {
  previousPlan?: string;
  newPlan?: string;
  effectiveDate?: string;
  billingUrl?: string;
}

export const SubscriptionPlanChangeEmail = ({
  previousPlan = 'Starter',
  newPlan = 'Scale Up',
  effectiveDate = 'January 15, 2025',
  billingUrl = 'https://app.userplane.io/billing',
}: SubscriptionPlanChangeEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(previousPlan, newPlan)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(previousPlan, newPlan)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](newPlan, effectiveDate)}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={billingUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default SubscriptionPlanChangeEmail;
