/**
 * Offboarding - Account Deletion Email
 * Sent when a user's account has been deleted
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/offboarding/account-deletion';
import { getUserName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface AccountDeletionEmailProps {
  userName: string;
  feedbackUrl: string;
}

export const AccountDeletionEmail = ({ userName, feedbackUrl }: AccountDeletionEmailProps) => {
  const formattedUserName = getUserName(userName);

  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.greeting(formattedUserName)}</Text>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      {feedbackUrl && (
        <Section style={styles.ctaSection}>
          <Link href={feedbackUrl} style={styles.secondaryButton}>
            {copy.cta}
          </Link>
        </Section>
      )}
    </EmailLayout>
  );
};

export default AccountDeletionEmail;
