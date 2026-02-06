/**
 * Auth - Email Verification Email
 * Sent when a user needs to verify their email address
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/auth/email-verification';
import { getUserName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface EmailVerificationEmailProps {
  userName: string;
  verificationUrl: string;
  logoUrl?: string;
}

export const EmailVerificationEmail = ({
  userName,
  verificationUrl,
  logoUrl,
}: EmailVerificationEmailProps) => {
  const formattedUserName = getUserName(userName);

  return (
    <EmailLayout preview={copy.preview} showSupport={false} logoUrl={logoUrl}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.greeting(formattedUserName)}</Text>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={verificationUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>
          <Link href={verificationUrl} style={styles.link}>
            {copy.fallbackText}
          </Link>
        </Text>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.footer}</Text>
      </Section>
    </EmailLayout>
  );
};

export default EmailVerificationEmail;
