/**
 * Offboarding - Account Restored Email
 * Sent when a suspended user's account has been restored
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/offboarding/account-restored';
import { getUserName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface AccountRestoredEmailProps {
  userName: string;
  loginUrl: string;
}

export const AccountRestoredEmail = ({ userName, loginUrl }: AccountRestoredEmailProps) => {
  const formattedUserName = getUserName(userName);

  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.greeting(formattedUserName)}</Text>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={loginUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default AccountRestoredEmail;
