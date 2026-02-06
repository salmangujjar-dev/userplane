/**
 * Offboarding - Account Deletion Verification Email
 * Sent when a user requests to delete their account
 * Requires clicking the verification link to confirm deletion
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/offboarding/account-deletion-verification';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface AccountDeletionVerificationEmailProps {
  verificationUrl: string;
  logoUrl?: string;
}

export const AccountDeletionVerificationEmail = ({
  verificationUrl,
  logoUrl,
}: AccountDeletionVerificationEmailProps) => {
  return (
    <EmailLayout preview={copy.preview} logoUrl={logoUrl}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={verificationUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.footer}</Text>
      </Section>
    </EmailLayout>
  );
};

export default AccountDeletionVerificationEmail;
