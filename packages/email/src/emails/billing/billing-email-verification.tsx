/**
 * Billing - Billing Email Verification
 * Sent when a billing email change is requested and needs verification
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/billing/billing-email-verification';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface BillingEmailVerificationEmailProps {
  verificationUrl: string;
  previousEmail: string;
  newEmail: string;
}

export const BillingEmailVerificationEmail = ({
  verificationUrl,
  previousEmail,
  newEmail,
}: BillingEmailVerificationEmailProps) => {
  const bodyText = copy.body(previousEmail, newEmail);

  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{bodyText[0]}</Text>
        <Text style={styles.messageText}>{bodyText[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={verificationUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default BillingEmailVerificationEmail;
