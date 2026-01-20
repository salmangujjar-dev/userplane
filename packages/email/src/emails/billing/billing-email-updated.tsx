/**
 * Billing - Billing Email Updated
 * Sent when workspace billing email is changed
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/billing/billing-email-updated';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface BillingEmailUpdatedEmailProps {
  previousEmail: string;
  newEmail: string;
  billingUrl: string;
}

export const BillingEmailUpdatedEmail = ({
  previousEmail,
  newEmail,
  billingUrl,
}: BillingEmailUpdatedEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(previousEmail, newEmail)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
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

export default BillingEmailUpdatedEmail;
