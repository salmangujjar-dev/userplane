/**
 * Offboarding - Account Restored Email
 * Sent when a suspended user's account has been restored
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/offboarding/account-restored';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface AccountRestoredEmailProps {
  loginUrl: string;
}

export const AccountRestoredEmail = ({ loginUrl }: AccountRestoredEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
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
