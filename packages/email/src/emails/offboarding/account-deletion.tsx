/**
 * Offboarding - Account Deletion Email
 * Sent when a user's account has been deleted
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';
import { copy } from '../../copy/offboarding/account-deletion';

export interface AccountDeletionEmailProps {
  userName?: string;
  feedbackUrl?: string;
}

export const AccountDeletionEmail = ({
  userName = 'there',
  feedbackUrl = 'https://userplane.io/feedback',
}: AccountDeletionEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.greeting(userName)}</Text>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={feedbackUrl} style={styles.secondaryButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default AccountDeletionEmail;
