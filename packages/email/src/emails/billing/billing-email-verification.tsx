/**
 * Billing - Billing Email Verification
 * Sent when a billing email change is requested and needs verification
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/billing/billing-email-verification';
import { getWorkspaceName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface BillingEmailVerificationEmailProps {
  workspaceName: string;
  verificationUrl: string;
}

export const BillingEmailVerificationEmail = ({
  workspaceName,
  verificationUrl,
}: BillingEmailVerificationEmailProps) => {
  const formattedWorkspaceName = getWorkspaceName(workspaceName);

  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(formattedWorkspaceName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
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
