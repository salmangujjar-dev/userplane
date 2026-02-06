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
  logoUrl?: string;
}

export const BillingEmailUpdatedEmail = ({
  previousEmail,
  newEmail,
  billingUrl,
  logoUrl,
}: BillingEmailUpdatedEmailProps) => {
  const bodyText = copy.body(previousEmail, newEmail);

  return (
    <EmailLayout preview={copy.preview} logoUrl={logoUrl}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{bodyText[0]}</Text>
        <Text style={styles.messageText}>{bodyText[1]}</Text>
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
